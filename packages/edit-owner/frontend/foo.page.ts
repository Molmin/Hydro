import $ from 'jquery';
import {
  addPage, i18n, NamedPage, request,
} from '@hydrooj/ui-default';

addPage(new NamedPage(['problem_detail'], () => {
  $('.section.side ol.menu').append(`
    <li class="menu__item nojs--hide"><a class="menu__link" href="javascript:;" name="problem-sidebar__edit-owner">
      <span class="icon icon-edit"></span> ${i18n('Edit owner')}
    </a></li>
  `);
  $(document).on('click', '[name="problem-sidebar__edit-owner"]', async (ev) => {
    ev.preventDefault();
    const target = await window.Hydro.components.selectUser();
    if (!target) return;
    try {
      const res = await request.post(`./${UiContext.pdoc.docId}/edit_owner`, { owner: target._id });
      if (res.url) window.location.href = res.url;
      else window.location.reload();
    } catch (error) {
      window.Hydro.components.Notification.error(error.message);
    }
  });
}));
