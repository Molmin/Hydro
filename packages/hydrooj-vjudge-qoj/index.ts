import {
    Context,
} from 'hydrooj';
import provider from './provider';

// export class ProblemSyncHandler extends Handler {
//     @post('pid', Types.String)
//     async post(
//         domainId: string, pid: string,
//     ) {
//         if (domainId !== 'qoj') throw new NotFoundError('No syncing support');
//         if (!pid.startsWith('P')) pid = `P${pid}`;
//         if (!/^P\d{1,5}$/.test(pid)) throw new ValidationError('pid');
//         this.ctx.vjudge
//         // const pdoc = await ProblemModel.get(domainId, pid);
//         // if (!pdoc) throw new ProblemNotFoundError(domainId, pid);
//         // const udoc = await UserModel.getById(domainId, owner);
//         // if (!udoc) throw new UserNotFoundError(domainId, owner);
//         // await ProblemModel.edit(domainId, pdoc.docId, { owner });
//         // this.back();
//     }
// }

export function apply(ctx: Context) {
    ctx.inject(['vjudge'], async (c) => {
        c.vjudge.addProvider('qoj', provider);
    });
    // ctx.Route('problem_sync', '/sync_problem', ProblemSyncHandler);
    // ctx.i18n.load('zh', {
    //     'Sync problem': '同步题目',
    // });
}
