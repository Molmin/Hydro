import {
  addPage, i18n, NamedPage,
} from '@hydrooj/ui-default';

addPage(new NamedPage(['problem_main'], () => {
  if (UiContext.domain._id !== 'qoj') return;
  $('.main > .row > .medium-3.columns').prepend(`
    <div class="section side visible">
      <div class="section__header edit-mode-hide">
        <h1 class="section__title">${i18n('Sync problem')}</h1>
      </div>
      <div class="section__body">
      <form method="post" action="./sync_problem">
        <div class="row">
          <div class="medium-12 columns form__item end">
            <label>
              题目编号
              <div name="form_item_pid" class="textbox-container">
                <input type="text" name="pid" value="" placeholder="1234" class="textbox">
              </div>
            </label>
          </div>
        </div>
        <input type="submit" class="rounded primary button" value="同步">
      </form>
      </div>
    </div>
  `);
}));
