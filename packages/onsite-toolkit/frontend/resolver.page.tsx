/* eslint-disable no-await-in-loop */
import { animated, easings, useSprings } from '@react-spring/web';
import useKey from 'react-use/lib/useKey';
import {
  addPage, NamedPage, React, ReactDOM, request,
} from '@hydrooj/ui-default';
import { ResolverInput } from '../interface';

function convertPayload(ghost: string): ResolverInput {
  const lines = ghost.split('\n');

  const problemCount = +(lines[2].split(' ')[1]);
  const teamCount = +(lines[3].split(' ')[1]);
  const submissionCount = +(lines[4].split(' ')[1]);
  const data: ResolverInput = {
    name: lines[0].split('"')[1].split('"')[0],
    frozen: (3.5 - 0.75) * 60 * 60,
    // frozen: (4 - 1) * 60 * 60,
    teams: [],
    submissions: [],
    duration: 0,
    problems: [],
    institutions: {},
  };
  for (let i = 5; i < 5 + problemCount; i++) {
    const problem = lines[i].match(/@p (.+),.+,20,0/);
    // @p A,Two Regular Polygons,20,0
    if (!problem) continue;
    data.problems.push({
      color: '#000000',
      id: problem[1],
      name: problem[1],
    });
  }
  for (let i = 5 + problemCount; i < 5 + problemCount + teamCount; i++) {
    const team = lines[i].match(/@t (\d+),\d+,\d+,(.*)/);
    if (!team) continue;
    data.teams.push({
      id: team[1],
      name: team[2].split('-')[1],
      institution: team[2].split('-')[0],
      exclude: false,
    });
  }
  for (let i = 5 + problemCount + teamCount; i < 5 + problemCount + teamCount + submissionCount; i++) {
    // @s 3,C,1,10066,AC
    const line = lines[i].split(' ')[1].split(',');
    data.submissions.push({
      team: line[0],
      problem: line[1],
      verdict: line[4] as 'AC' | 'RJ',
      time: +(line[3]),
      score: +(line[5]),
    });
  }
  return data;
}

async function scrollTo(offset) {
  const fixedOffset = offset.toFixed();
  await new Promise((resolve) => {
    const onScroll = function () {
      if (window.pageYOffset.toFixed() === fixedOffset) {
        window.removeEventListener('scroll', onScroll);
        resolve(null);
      }
    };

    window.addEventListener('scroll', onScroll);
    onScroll();
    window.scrollTo({
      top: offset,
      behavior: 'smooth',
    });
  });
}
interface DisplaySettings {
  showAvatar: boolean;
  showSchool: boolean;
}

interface Props extends DisplaySettings {
  data: ResolverInput;
}

function status(problem) {
  if (!problem) return 'untouched';
  if (problem.pass) return 'ac';
  if (!problem.old && !problem.frozen) return 'untouched';
  if (problem.frozen) return 'frozen';
  return 'failed';
}

function submissions(problem) {
  const st = status(problem);
  // if (st === 'ac') { return `${problem.old}`; }
  if (st === 'frozen') { return `${problem.score}+${problem.frozen}`; }
  if (st === 'ac' || st === 'failed') { return `${problem.score}`; }
  return problem.id;
}

function start(data: ResolverInput, options: DisplaySettings) {
  $('title').text(data.name);
  $('#title').text(data.name);
  $('.footer').css('display', 'none');
  const teams = data.teams.map((v) => ({
    id: v.id,
    rank: 0,
    score: 0,
    penalty: 0,
    ranked: !v.exclude,
    total: 0,
    problems: data.problems.map((p) => ({
      old: 0,
      frozen: 0,
      pass: false,
      id: p.id,
      score: 0,
      firstAccept: false,
    })),
  }));
  const firstAccepted: Record<string, boolean> = {};
  console.info(teams);
  const allSubmissions = data.submissions.sort((a, b) => a.time - b.time);
  for (const submission of allSubmissions) {
    const team = teams.find((v) => v.id === submission.team);
    console.info(submission, team, submission.time, data.frozen);
    if (!team) continue;
    const isFrozen = submission.time > data.frozen;
    const problem = team.problems.find((i) => i.id === submission.problem);
    if (!problem || problem.pass) continue;
    team.total++;
    if (submission.verdict === 'AC' && !firstAccepted[submission.problem]) {
      problem.firstAccept = true;
      firstAccepted[submission.problem] = true;
    }
    if (isFrozen) problem.frozen += 1;
    else {
      if (submission.verdict === 'AC') {
        problem.pass = true;
        // team.penalty += submission.time + problem.old * 20 * 60;
      }
      if (submission.score > problem.score) {
        team.score += submission.score - problem.score;
        problem.score = submission.score;
      }
      problem.old += 1;
    }
  }

  function MainList(props: Props) {
    const [selectedTeam, setTeam] = React.useState('');
    const [selectedProblem, setP] = React.useState<string | null>(null);
    const [executeIdx, setExecuteIdx] = React.useState(0);
    const [, setRenderC] = React.useState(0);

    function processRank(source = teams) {
      const clone = [...source];
      clone.sort((a, b) => b.score - a.score || a.penalty - b.penalty || b.total - a.total);
      let rank = 1; let lastScore = Infinity; let lastRank = 0;
      for (const team of clone) {
        if (team.ranked) {
          if (lastScore === team.score) {
            team.rank = lastRank;
          } else {
            lastScore = team.score;
            lastRank = rank;
            team.rank = rank;
          }
          rank++;
        } else {
          team.rank = -1;
        }
      }
      return clone.map((i) => source.indexOf(i));
    }

    const order = React.useRef(processRank());

    const [springs, api] = useSprings(teams.length, (index) => ({
      y: order.current.indexOf(index) * 103 - index * 103,
      scale: 1,
      zIndex: 0,
      shadow: 1,
      immediate: (key: string) => key === 'y' || key === 'zIndex',
    }));

    const operations = {
      async highlightTeam(teamId: string, scrollIdx: number) {
        setP(null);
        setTeam(teamId);
        await scrollTo(scrollIdx * 103 - window.innerHeight + 261);
      },
      async highlightProblem(problemId: string) {
        setP(problemId);
      },
      async revealProblem(teamId: string, problemId: string) {
        const team = teams.find((i) => i.id === teamId);
        const problem = team?.problems.find((i) => i.id === problemId);
        if (!team || !problem) return;
        const sub = allSubmissions.filter((s) => s.team === teamId && s.problem === problemId);
        for (const s of sub) {
          if (s.verdict === 'AC') {
            problem.pass = true;
          }
          if (s.score > problem.score) {
            team.score += s.score - problem.score;
            problem.score = s.score;
          }
          problem.old += 1;
        }
        problem.frozen = 0;
        setP(null);
      },
      async updateRank() {
        order.current = processRank();
        api.start((index) => ({
          y: order.current.indexOf(index) * 103 - index * 103,
          scale: 1,
          zIndex: 0,
          shadow: 1,
          config: {
            easing: easings.steps(5),
          },
        }));
      },
    };

    const calculated = React.useMemo(() => {
      window.scrollTo(0, document.body.scrollHeight);
      const clone = JSON.parse(JSON.stringify(teams));
      const ops: { name: string, args: any[] }[] = [];
      function queueOperations(name: string, ...args: any[]) {
        ops.push({ name, args });
      }
      let order = processRank(clone);
      for (let i = clone.length - 1; i >= 0; i--) {
        const team = clone[order[i]];
        queueOperations('highlightTeam', team.id, i);
        for (const pinfo of data.problems) {
          const problem = team.problems.find((i) => i.id === pinfo.id);
          if (!problem || !problem.frozen || problem.pass) continue;
          queueOperations('highlightProblem', pinfo.id);
          queueOperations('revealProblem', team.id, pinfo.id);
          // scroll to selected line
          const oldScore = problem.score;
          const sub = allSubmissions.filter((s) => s.team === team.id && s.problem === problem.id);
          for (const s of sub) {
            if (s.verdict === 'AC') {
              problem.pass = true;
            }
            if (s.score > problem.score) {
              team.score += s.score - problem.score;
              problem.score = s.score;
            }
            problem.old += 1;
          }
          problem.frozen = 0;
          if (problem.score > oldScore) {
            queueOperations('updateRank');
            const oldOrder = JSON.stringify(order);
            order = processRank(clone);
            if (oldOrder !== JSON.stringify(order)) {
              i++;
              break;
            }
          }
        }
      }
      console.log(ops);
      return ops;
    }, [data]);

    useKey('ArrowRight', async () => {
      console.info(calculated, executeIdx);
      const op = calculated[executeIdx];
      if (!op) return;
      setExecuteIdx(executeIdx + 1);
      console.log(op.name, op.args);
      await operations[op.name](...op.args);
      setRenderC((i) => i + 1);
    }, {}, [executeIdx, calculated]);

    return (<>
      {springs.map(({
        zIndex, y,
      }, i) => {
        const team = teams[i];
        const teamInfo = data.teams.find((i) => i.id === team.id);
        if (!teamInfo) return <animated.div key={i}>Team info for id {team.id} not found</animated.div>;
        return <animated.div
          key={i}
          className="rank-list-item clearfix"
          style={{
            zIndex,
            // boxShadow: shadow.to((s) => `rgba(0, 0, 0, 0.15) 0px ${s}px ${2 * s}px 0px`),
            y,
            ...(selectedTeam === team.id ? {
              backgroundColor: '#406b82',
            } : {
              background: 'transparent',
            }),
          }}
          children={<>
            <div className="rank">{team.rank === -1 ? '*' : team.rank}</div>
            {props.showAvatar && <img className="avatar" style={{ height: 32 }} src={`${teamInfo?.avatar}`} />}
            <div className="content">
              <div className="name" style={{ color: 'white', fontSize: 24 }}>
                {props.showSchool ? `${teamInfo.institution}--` : ''}{teamInfo.name}
              </div>
              <ul className="problems">
                {data.problems.map((v) => {
                  const uncover = team?.id === selectedTeam && selectedProblem === v.id;
                  const problemStatus = team.problems.find((i) => i.id === v.id);
                  const className = [
                    status(problemStatus),
                    uncover ? 'uncover' : '',
                    'p-content',
                    problemStatus?.firstAccept ? 'firstAccept' : '',
                  ].join(' ');
                  return <li className={`${status(problemStatus)} ${uncover ? 'uncover' : ''} item`}>
                    <div className={className}>{submissions(problemStatus)}</div>
                  </li>;
                })}
              </ul>
            </div>
            {/* <div className="penalty" style={{ color: 'white' }}>{Math.floor(team.penalty / 60)}</div> */}
            <div className="solved" style={{ color: 'white' }}>{team.score}</div>
          </>}
        />;
      })}
    </>);
  }
  ReactDOM.createRoot(document.getElementById('rank-list')!).render(<MainList {...options} data={data} />);
}

async function loadAndStart(input: string, options: DisplaySettings) {
  let data;
  try {
    if (input.startsWith('@')) data = convertPayload(input);
    else data = JSON.parse(input);
  } catch (e) {
    console.log(`load data from url. [url=${input}]`);
    const res = await request.get(input, {}, {
      dataType: 'text',
    });
    if (res.startsWith('@')) data = convertPayload(res);
    else data = JSON.parse(res);
  }
  start(data, options);
}

addPage(new NamedPage(['resolver'], () => {
  $('#load').on('click', () => {
    const src = $('#input-data').val()?.toString()?.trim();
    if (src) {
      loadAndStart(src, {
        showAvatar: false,
        showSchool: false,
      });
    }
  });
}));
