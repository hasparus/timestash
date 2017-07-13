const fs = require('fs');

export function getData(fileName, type) {
  return new Promise(function(resolve, reject) {
    fs.readFile(fileName, type, (err, data) => {
        if (err) { reject(err); }
        resolve(data);
    })
  });
}

export function putData(data, fileName) {
  fs.writeFile(fileName, data, () => null);
}