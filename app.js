import { getData, putData } from './data_access';
'use strict';

const doBackups = true;
const file = './history.json';
const days = ['pon', 'wt', 'sr', 'czw', 'pt'];
const args = process.argv.slice(2);
const action = args[0];

getData(file, 'utf8')
  .then(content => {
    let tree = JSON.parse(content);

    if (check(action, 'backup')) {
      backup(JSON.stringify(tree, null, 2));
      return;
    }

    if (doBackups) backup(content);
    if (check(action, 'summary')) {
      tree = summary(tree);
    } else if (check(action, 'enter')) {
      tree = enter(tree);
    } else if (check(action, 'leave')) {
      tree = leave(tree);
    } else if (check(action, 'task')) {
      tree = task(tree, args[1], args.slice(2));
    } else if (check(action, 'dayoff')) {
      tree = skip(tree, args[1]);
    }
    const json = JSON.stringify(tree, null, 2);
    console.log(json);
    putData(json, file);
  })
  .catch(error => {
    console.log('Failed to read history. Error: ' + error);
  });

function check(action, expected) {
  return action === expected || action === expected[0];
}

// node timestash task start programming
function task(tree, action, rest) {
  const title = rest[0];

  tree.tasks = tree.tasks || {};
  tree.tasks[title] = tree.tasks[title] || [];
  tree.tasks[title].push({
    [action]: new Date().toLocaleString(),
  });
  return tree;
}

function skip(tree, howMuch = 1) {
  while (howMuch > 0) {
    enter(tree);
    const weeks = tree.weeks;
    const lastWeek = weeks[weeks.length - 1];
    const lastDay = lastWeek[days[Object.keys(lastWeek).length - 1]];
    delete lastDay.enter;
    lastDay.hours[0] = lastDay.hours[1] = 0;
    lastDay.skipped = true;
    lastDay.time = 0;

    howMuch--;
  }
  return tree;
}

function enter(tree) {
  const weeks = tree.weeks;
  let lastWeek = weeks[weeks.length - 1];
  let length = Object.keys(lastWeek).length;
  if (length === 5) {
    length = 0;
    lastWeek = {};
    weeks.push(lastWeek);
  }
  lastWeek[days[length]] = {
    hours: [floatTimeNow(), null],
    entered: new Date().toLocaleString(),
  };

  return tree;
}

function leave(tree) {
  const weeks = tree.weeks;
  const lastWeek = weeks[weeks.length - 1];
  const lastDay = lastWeek[days[Object.keys(lastWeek).length - 1]];
  const date = new Date();
  lastDay.left = date.toLocaleString();
  lastDay.hours[1] = floatTimeNow(date);
  lastDay.time = lastDay.hours.reduce((a, v) => v - a);

  return tree;
}

function floatTimeNow(date) {
  date = date || new Date();
  return date.getHours() + date.getMinutes() / 60;
}

function backup(str) {
  putData(str, `./backup/history${Date.now()}.json`);
}

function summary(tree) {
  let sum = 0;
  let max = 0;
  for (const week of tree.weeks) {
    for (const k in week) {
      const day = week[k];
      day.time = /* day.time || */day.hours.reduce((a, v) => a && v ? v - a : 0);
      sum += day.time;
      max += 8;
    }
  }
  console.log(`\nSum: ${sum}. Max: ${max}\n`);
  return tree;
}
