'use babel';

import {
  exec
} from 'child_process';

module.exports = {
  pluginAction(subcommand) {
    return new Promise((resolve, reject) => {
      let descamMain = require('./descam');
      let utilities = require('./utilities');
      let result = "";
      let DESCAMPATH = atom.config.get('descam.PathToBinFolder');
      if (utilities.checkDescamPath(DESCAMPATH)) {} else if (utilities.checkEnvVar()) {
        DESCAMPATH = process.env.DESCAM;
      } else {
        let errorMsg = "Please make sure that the correct path to the DeSCAM bin folder in the DeSCAM package settings or as DeSCAM environment variable is set!";
        atom.notifications.addError(errorMsg)
        reject(errorMsg);
      }
      if (DESCAMPATH.includes("/bin")) {
        descamMain.activePane = atom.workspace.getActivePane();
        currentTab = atom.workspace.getActivePaneItem();
        editor = atom.workspace.getActiveTextEditor();
        if (editor !== undefined) {
          lang = editor.getGrammar().name;
          if (utilities.checkGrammar(lang)) {
            filePath = currentTab.buffer.file.path;
            if ((filePath !== null || filePath !== undefined)) {
              let cmd = "";
              if (subcommand !== "h") {
                atom.notifications.addInfo("Processing!", {
                  detail: [
                    `plugin: ${subcommand}`,
                    `file: ${filePath}`
                  ].join('\n'),
                  //dismissable: true,
                });
                descamMain.outputPath = utilities.makeDirPath(filePath);
                exec(`mkdir ${descamMain.outputPath}/DESCAM_OUTPUT`);
                cmd = `${DESCAMPATH}/DESCAM -f ${filePath} -o ${descamMain.outputPath}/DESCAM_OUTPUT  -${subcommand}`;
              } else {
                cmd = `${DESCAMPATH}/DESCAM -h`;
              }
              let child = exec(cmd, (error) => {
                if (error !== null) {
                  console.log(error);
                }
              });
              child.stdout.on('data', function(data) {
                result += data;
                //console.log(data);
              });
              child.on('close', function() {
                // console.log(result);
                resolve(result);
              });
            } else {
              let errorMsg = "file path could not be resolved!";
              atom.notifications.addError(errorMsg)
              reject(errorMsg);
            }
          } else {
            let errorMsg = "DeSCAM can only process C++ files!";
            atom.notifications.addError(errorMsg)
            reject(errorMsg);
          }
        } else {
          let errorMsg = "Could not detect an open C++ file in the current tab!";
          atom.notifications.addError(errorMsg)
          reject(errorMsg);
        }
      } else {
        let errorMsg = "Please make sure that the correct path to the DESCAM bin folder is set!";
        atom.notifications.addError(errorMsg)
        reject(errorMsg);
      }
    });
  },

  async lint(filePath) {
    let descamMain = require('./descam');
    let lintMessages = [];
    descamMain.lastLintedFiles.add(filePath);
    /*lintMessages = await getLintingFeedback(filePath);
    if (lintMessages[0] == 1) { // supposing that the first element indicates wether there is a parsing error, the second element represents the error message
      //lintMessages =  error message
    } else if (lintMessages[0] == 0) { // first element = 0 => no parsing error, the second element represents the array of linting messages
      //lintMessages = linting messages for the file
    }*/
    //Displaying a test message
    lintMessages = [{
        severity: 'info',
        excerpt: "test",
        description: "Descam linter test message",
        location: {
          file: filePath,
          position: [
            [0, 0],
            [0, 0]
          ]
        }
      }
      /*,{
            severity: 'warning',
            excerpt: "Function: 'func' should be declared const",
            location: {
              file: filePath,
              position: [
                [23, 0],
                [23, 32]
              ]
            }
          } */
    ];

    descamMain.linterMessages[filePath] = lintMessages;
    if (typeof descamMain.descamLinter != "undefined") {
      descamMain.descamLinter.setAllMessages(lintMessages)
    }
  },

  getLintingFeedback(filePath) {
    return new Promise((resolve, reject) => {
      let utilities = require('./utilities');
      let result = [];
      let linterPath = "";
      if (utilities.checkDescamPath(atom.config.get('descam.PathToLinter'))) {
        linterPath = atom.config.get('descam.PathToLinter');
      } else {
        let errorMsg = "Please make sure that the correct path to the DeSCAM linter folder in the DeSCAM package settings is set!";
        atom.notifications.addError(errorMsg)
        reject(errorMsg);
      }
      descamMain.activePane = atom.workspace.getActivePane();
      currentTab = atom.workspace.getActivePaneItem();
      editor = atom.workspace.getActiveTextEditor();
      if (editor !== undefined) {
        if ((filePath !== null || filePath !== undefined)) {
          let cmd = ""; // command to be passed to the linter `${linterPath}/linter ${filePath}`
          let child = exec(cmd, (error) => {
            if (error !== null) {
              console.log(error);
            }
          });
          child.stdout.on('data', function(data) {
            result += data;
            //console.log(data);
          });
          child.on('close', function() {
            // console.log(result);
            resolve(result);
          });
        }
      }
    });
  },

}
