import {
    Context, Handler, post,
    PRIV, ProblemModel, ProblemNotFoundError, route,
    Types, UserModel, UserNotFoundError,
} from 'hydrooj';

export class ProblemEditOwnerHandler extends Handler {
    @route('pid', Types.ProblemId)
    @post('owner', Types.Int)
    async post(
        domainId: string, pid: string | number, owner: number,
    ) {
        const pdoc = await ProblemModel.get(domainId, pid);
        if (!pdoc) throw new ProblemNotFoundError(domainId, pid);
        const udoc = await UserModel.getById(domainId, owner);
        if (!udoc) throw new UserNotFoundError(domainId, owner);
        await ProblemModel.edit(domainId, pdoc.docId, { owner });
        this.back();
    }
}

export function apply(ctx: Context) {
    ctx.Route('problem_edit_owner', '/p/:pid/edit_owner', ProblemEditOwnerHandler, PRIV.PRIV_EDIT_SYSTEM);
    ctx.i18n.load('zh', {
        'Edit owner': '编辑所有者',
    });
}
