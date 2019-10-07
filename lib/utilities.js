'use babel';

import {
  exec
} from 'child_process';
import dotenv from 'dotenv';

module.exports = {

  checkEnvVar() {
    if (process.env.DESCAM) {
      return true;
    } else {
      return false;
    }
  },

  makeDirPath(filePath) {
    var i = 0;
    for (i = filePath.length - 1; i >= 0; i--) {
      if (filePath.charAt(i) === '/') {
        break;
      }
    }
    return filePath.substring(0, i);
  },

  createNewTab(textContent) {
    let descamMain = require('./descam');
    let txtEditor = atom.workspace.buildTextEditor({
      autoHeight: false
    });
    let item = descamMain.activePane.addItem(txtEditor);
    descamMain.activePane.activateItem(item);
    txtEditor.setText(textContent);
  },

  openFile(pathToFile) {
    let cmd = `atom -n false ${pathToFile}`;
    let child = exec(cmd, (error) => {
      if (error !== null) {
        atom.notifications.addError(error.toString());
      }
    });
  },

  async checkIfFileExists(pathToFile) {
    let cmd = `test -d ${pathToFile} && echo "exists" || echo "file not found"`;
    const result = await module.exports.runCmd(cmd);
    if (result.includes("exists")) return true;
    else return false;

  },

  async getFilesInDir(pathToFile) {
    let cmd = `ls ${pathToFile}`;
    let result = await module.exports.runCmd(cmd);
    let filesInDirArray = result.split(/\r?\n/);
    return filesInDirArray;

  },

  runCmd(cmd) {
    return promise = new Promise((resolve, reject) => {
      let result = "";
      let child = exec(cmd, (error) => {
        if (error !== null) {
          atom.notifications.addError(error.toString());
        }
      });
      child.stdout.on('data', function(data) {
        result += data;
      });
      child.on('close', function() {
        resolve(result);
      });
    });
  },

  makeValuesArrayFromObject(object) {
    let array = [];
    for (let key in object) {
      if (object.hasOwnProperty(key)) {
        object[key].forEach((entry) => {
          array.push(entry);
        });
      }
    }
    return array;
  },

  getCppEditor(editor){
    if (!editor) return undefined;
    grammar = editor.getGrammar().name;
    if (!module.exports.checkGrammar(grammar)) {
      return undefined;
    }
    return editor;
  },

  checkGrammar(grammar) {
    if (grammar == "C" || grammar.indexOf("C++") != -1) {
      return true;
    }
    return false;
  },

  checkDescamPath(path){
      if (path.length !== 0 && path !== undefined) {
        return true;
      }
        return false;
  },

}
