import { getData, putData } from './data_access';
'use strict';

const doBackups = true;
const file = './history.json';
const days = ['pon', 'wt', 'sr', 'czw', 'pt'];
const args = process.argv.slice(2);
const action = args[0];

getData(file, 'utf8').then(tree => {
  if (doBackups) backup(tree);
  tree = JSON.parse(tree);
  if (check(action, 'enter')) {
    tree = enter(tree);
  } else if (check(action, 'leave')) {
    tree = leave(tree);
  } else if (check(action, 'task')) {
    tree = task(tree, args[1], args.slice(2));
  } else if (check(action, 'backup')) {
    backup(JSON.stringify(tree, null, 2));
  }
  const json = JSON.stringify(tree, null, 2);
  console.log(json);
  putData(json, file);
}).catch(error => {
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
