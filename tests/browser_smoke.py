"""Functional browser checks. Requires Python Playwright and Chromium."""
import functools
import json
import os
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import threading
import unittest

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class CockpitTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
        cls.url = f'http://127.0.0.1:{cls.server.server_port}/'

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        self.context = self.browser.new_context(viewport={'width': 1536, 'height': 1100})
        self.page = self.context.new_page()
        self.page.set_default_timeout(2500)
        self.errors = []
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        self.page.goto(self.url)

    def tearDown(self):
        self.assertEqual(self.errors, [])
        self.context.close()

    def add_record(self, kind, title, direction='', body=None, steps=None):
        self.page.locator('#quick-add').click()
        self.page.locator('#record-kind').select_option(kind)
        if kind == 'notes':
            self.page.locator('#record-body').fill(body or title)
        else:
            self.page.locator('#record-title').fill(title)
        if kind != 'sites':
            self.page.locator('#record-direction').select_option(direction)
        if steps is not None:
            self.page.locator('#record-steps').fill(steps)
        self.page.locator('#record-submit').click()

    def test_tasks_projects_and_notes_survive_reload(self):
        self.page.locator('#task-text').fill('浏览器测试待办')
        self.page.get_by_role('button', name='添加待办', exact=True).click()
        self.page.get_by_role('checkbox', name='完成待办：浏览器测试待办', exact=True).click()
        self.page.locator('#task-filter').select_option('done')
        self.assertTrue(self.page.get_by_role('checkbox', name='完成待办：浏览器测试待办').is_checked())
        self.add_record('projects', '浏览器测试学习', 'learn', steps='理解\n动手')
        project = self.page.locator('.project').filter(has_text='浏览器测试学习')
        project.get_by_role('checkbox', name='理解', exact=True).click()
        self.assertIn('1 / 2', project.inner_text())
        self.page.locator('#note-text').fill('浏览器测试想法')
        self.page.locator('#note-save').click()
        self.page.reload()
        self.assertIn('浏览器测试想法', self.page.locator('#notes-list').inner_text())
        self.assertIn('1 / 2', self.page.locator('.project').filter(has_text='浏览器测试学习').inner_text())
        self.page.locator('#task-filter').select_option('done')
        self.assertTrue(self.page.get_by_role('checkbox', name='完成待办：浏览器测试待办').is_checked())

    def test_editing_steps_preserves_completion_and_plans_change_status(self):
        self.add_record('projects', '编辑学习', 'learn', steps='甲\n乙')
        project = self.page.locator('.project').filter(has_text='编辑学习')
        project.get_by_role('checkbox', name='甲', exact=True).click()
        self.page.get_by_role('button', name='编辑学习：编辑学习', exact=True).click()
        self.page.locator('#record-steps').fill('乙\n甲\n丙')
        self.page.locator('#record-submit').click()
        self.assertTrue(project.get_by_role('checkbox', name='甲', exact=True).is_checked())
        self.assertFalse(project.get_by_role('checkbox', name='乙', exact=True).is_checked())
        self.add_record('plans', '状态迁移计划', 'ai')
        plan = self.page.locator('.plan-card').filter(has_text='状态迁移计划')
        plan.get_by_role('button', name='推进计划：状态迁移计划', exact=True).click()
        self.assertTrue(self.page.locator('[data-status="active"] .plan-card').filter(has_text='状态迁移计划').is_visible())
        plan.get_by_role('button', name='推进计划：状态迁移计划', exact=True).click()
        self.assertTrue(self.page.locator('[data-status="done"] .plan-card').filter(has_text='状态迁移计划').is_visible())

    def test_search_filter_and_user_markup_are_safe(self):
        hostile = '<img src=x onerror="window.attacked=1">'
        self.add_record('notes', hostile, 'govern')
        self.page.locator('[data-direction="govern"]').first.click()
        self.assertIn(hostile, self.page.locator('#notes-list').inner_text())
        self.assertEqual(self.page.locator('#notes-list img').count(), 0)
        self.assertIsNone(self.page.evaluate('window.attacked'))
        self.page.locator('#global-search').fill('没有这种记录')
        self.assertNotIn(hostile, self.page.locator('#notes-list').inner_text())
        self.page.locator('#clear-filters').click()
        self.assertIn(hostile, self.page.locator('#notes-list').inner_text())

    def test_backup_validation_and_explicit_replacement(self):
        self.add_record('notes', '导出前记录', 'ai')
        self.page.locator('#settings-button').click()
        with self.page.expect_download() as download:
            self.page.locator('#export-button').click()
        backup = Path(download.value.path()).read_bytes()
        self.page.locator('#settings-close').click()
        self.add_record('notes', '导出后记录', 'life')
        self.page.locator('#settings-button').click()
        self.page.locator('#import-file').set_input_files({'name': 'invalid.json', 'mimeType': 'application/json', 'buffer': b'{bad'})
        expect(self.page.locator('#settings-message')).to_contain_text('备份不是有效')
        self.page.locator('#import-file').set_input_files({'name': 'valid.json', 'mimeType': 'application/json', 'buffer': backup})
        expect(self.page.locator('#confirm-dialog')).to_be_visible()
        self.page.locator('#confirm-cancel').click()
        self.page.locator('#settings-close').click()
        self.assertIn('导出后记录', self.page.locator('#notes-list').inner_text())
        self.page.locator('#settings-button').click()
        self.page.locator('#import-file').set_input_files({'name': 'valid.json', 'mimeType': 'application/json', 'buffer': backup})
        self.page.locator('#confirm-accept').click()
        self.page.locator('#settings-close').click()
        self.page.reload()
        self.assertIn('导出前记录', self.page.locator('#notes-list').inner_text())
        self.assertNotIn('导出后记录', self.page.locator('#notes-list').inner_text())

    def test_clear_examples_keeps_personal_work(self):
        self.add_record('notes', '清理后保留我', 'life')
        self.page.locator('#settings-button').click()
        self.page.locator('#clear-examples').click()
        self.page.locator('#confirm-accept').click()
        self.page.locator('#settings-close').click()
        self.assertIn('清理后保留我', self.page.locator('#notes-list').inner_text())
        self.assertEqual(self.page.locator('.project').count(), 0)

    def test_imported_website_identifiers_cannot_break_rendering(self):
        self.page.locator('#settings-button').click()
        with self.page.expect_download() as download:
            self.page.locator('#export-button').click()
        backup = json.loads(Path(download.value.path()).read_text())
        backup['data']['sites'] = [{'id': 'imported site\twith spaces', 'name': '外部导入的站点', 'url': 'https://example.com/'}]
        self.page.locator('#import-file').set_input_files({
            'name': 'imported.json', 'mimeType': 'application/json',
            'buffer': json.dumps(backup).encode(),
        })
        self.page.locator('#confirm-accept').click()
        self.page.locator('#settings-close').click()
        self.assertTrue(self.page.get_by_role('link', name='外部导入的站点', exact=True).is_visible())
        self.page.reload()
        self.assertTrue(self.page.get_by_role('link', name='外部导入的站点', exact=True).is_visible())

    def test_two_open_tabs_preserve_independent_additions(self):
        other = self.context.new_page()
        other.goto(self.url)
        self.page.locator('#note-text').fill('第一个标签页的记录')
        self.page.locator('#note-save').click()
        other.locator('#note-text').fill('第二个标签页的记录')
        other.locator('#note-save').click()
        self.page.reload()
        self.assertIn('第一个标签页的记录', self.page.locator('#notes-list').inner_text())
        self.assertIn('第二个标签页的记录', self.page.locator('#notes-list').inner_text())
        other.close()

    def test_stale_record_editor_does_not_overwrite_another_tab(self):
        other = self.context.new_page()
        other.goto(self.url)
        self.page.get_by_role('button', name='编辑待办：读完一篇前沿文章', exact=True).click()
        other.get_by_role('button', name='编辑待办：读完一篇前沿文章', exact=True).click()
        other.locator('#record-title').fill('另一个标签页已修改的标题')
        other.locator('#record-submit').click()
        self.page.locator('#record-title').fill('过期编辑器中的标题')
        self.page.locator('#record-submit').click()
        self.assertTrue(self.page.locator('#record-dialog').is_visible())
        self.assertIn('其他标签页', self.page.locator('#toast').inner_text())
        self.page.reload()
        self.assertIn('另一个标签页已修改的标题', self.page.locator('#tasks-list').inner_text())
        other.close()

    def test_tools_have_real_results(self):
        self.page.locator('[data-tool="text"]').click()
        self.page.locator('#tool-input').fill('你好\nAI🙂')
        self.assertIn('6', self.page.locator('#tool-result').inner_text())
        self.assertIn('2 行', self.page.locator('#tool-result').inner_text())
        self.page.locator('#tool-close').click()
        self.page.locator('[data-tool="json"]').click()
        self.page.locator('#tool-input').fill('{"a":1}')
        self.page.locator('#json-format').click()
        self.assertIn('\n', self.page.locator('#tool-input').input_value())
        self.page.locator('#tool-input').fill('{bad')
        self.page.locator('#json-format').click()
        self.assertIn('无效', self.page.locator('#tool-result').inner_text())
        self.page.locator('#tool-close').click()
        self.page.locator('#focus-toggle').click()
        expect(self.page.locator('#focus-time')).not_to_have_text('25:00', timeout=2500)
        self.page.locator('#focus-toggle').click()
        self.page.locator('#focus-reset').click()
        self.assertEqual(self.page.locator('#focus-time').inner_text(), '25:00')

    def test_corrupt_storage_is_not_overwritten(self):
        self.page.evaluate("localStorage.setItem('personal-cockpit.workspace.v1','{broken')")
        self.page.reload()
        self.assertFalse(self.page.locator('#storage-alert').is_hidden())
        self.page.locator('#task-text').fill('不能覆盖原始记录')
        self.page.get_by_role('button', name='添加待办', exact=True).click()
        self.assertEqual(self.page.evaluate("localStorage.getItem('personal-cockpit.workspace.v1')"), '{broken')

    def test_failed_storage_keeps_notes_visible_and_exportable(self):
        self.page.evaluate("() => { Storage.prototype.setItem = function() { throw new DOMException('quota', 'QuotaExceededError'); }; }")
        self.page.locator('#note-text').fill('存储失败时也应可导出的记录')
        self.page.locator('#note-save').click()
        self.assertIn('存储失败时也应可导出的记录', self.page.locator('#notes-list').inner_text())
        self.assertIn('刷新或关闭前导出', self.page.locator('#storage-alert').inner_text())
        self.page.locator('#settings-button').click()
        with self.page.expect_download() as download:
            self.page.locator('#export-button').click()
        backup = json.loads(Path(download.value.path()).read_text())
        self.assertEqual(backup['data']['notes'][0]['body'], '存储失败时也应可导出的记录')

    def test_custom_websites_and_experiment_records(self):
        self.page.locator('[data-new="sites"]').click()
        self.page.locator('#record-title').fill('自定义网站')
        self.page.locator('#record-url').fill('javascript:alert(1)')
        self.page.locator('#record-submit').click()
        self.assertFalse(self.page.locator('#record-error').is_hidden())
        self.page.locator('#record-url').fill('https://example.com/')
        self.page.locator('#record-submit').click()
        self.assertEqual(self.page.get_by_role('link', name='自定义网站', exact=True).get_attribute('href'), 'https://example.com/')
        self.page.locator('[data-new="experiments"]').first.click()
        self.page.locator('#record-title').fill('研究资料整理工具')
        self.page.locator('#record-body').fill('用于整理学习过程中收集的资料')
        self.page.locator('#record-status').select_option('building')
        self.page.locator('#record-url').fill('https://example.com/tool')
        self.page.locator('#record-submit').click()
        card = self.page.locator('.experiment-card').filter(has_text='研究资料整理工具')
        self.assertIn('开发中', card.inner_text())
        self.assertEqual(card.get_by_role('link', name='打开工具').get_attribute('href'), 'https://example.com/tool')

    def test_responsive_layout_and_navigation(self):
        shots = Path(os.environ.get('COCKPIT_SCREENSHOTS', '/tmp/cockpit-screenshots'))
        shots.mkdir(parents=True, exist_ok=True)
        for width in [1536, 1280, 1024, 768, 390]:
            self.page.set_viewport_size({'width': width, 'height': 1100})
            self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'overflow at {width}')
            self.page.get_by_role('button', name='随手记', exact=True).first.click()
            self.assertTrue(self.page.locator('#note-text').is_visible())
            self.page.get_by_role('button', name='总览', exact=True).first.click()
            if width in [1536, 390]:
                self.page.screenshot(path=str(shots / f'cockpit-{width}.png'), full_page=True)


if __name__ == '__main__':
    unittest.main(verbosity=2)
