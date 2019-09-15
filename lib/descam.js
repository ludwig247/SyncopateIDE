'use babel';


import {
  CompositeDisposable
} from 'atom';
import {
  exec
} from 'child_process';
import dotenv from 'dotenv';
import DescamLinter from './descamLinter';


export default {
  subscriptions: null,
  outputPath: "",
  activePane: null,
  config: {
    "DESCAM_PATH": {
      "description": "Please insert the path to the DeSCAM bin folder on your local machine.",
      "type": "string",
      "default": "PATH TO THE DESCAM BIN FOLDER"
    }
  },

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register commands for the buttons added in the context and packages menus
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'descam:toggle': () => this.toggle(),
      'descam:help': () => this.help(),
      'descam:printITL': () => this.printITL(),
      'descam:printAML': () => this.printAML(),
      'descam:printVHDL': () => this.printVHDL(),
      'descam:printCFGDot': () => this.printCFGDot(),
      //add more commands here
    }));
  },

  deactivate() {
    this.activePane = null;
    this.subscriptions.dispose();
  },

  serialize() {},

  toggle() {},

  printITL() {
    this.runPlugin("PrintITL");
  },

  printAML() {
    this.runPlugin("PrintAML");
  },
  printVHDL() {
    this.runPlugin("PrintVHDL");
  },
  printCFGDot() {
    this.runPlugin("PrintCFGDot");
  },

  help() {
    this.runPlugin("h");
  },

  async runPlugin(pluginName) {
    try {
      const result = await this.pluginAction(pluginName);
      if (result !== "") {
        this.createNewTab(result);
        if (pluginName !== "h") {
          let outputFilesDir = `${this.outputPath}/DESCAM_OUTPUT/${pluginName}`;
          const fileExists = await this.checkIfFileExists(outputFilesDir);
          if (fileExists) {
            let filesInOutputDir = await this.getFilesInDir(outputFilesDir);
            //  console.log(filesInOutputDir);
            filesInOutputDir.forEach((file) => {
              if (file !== "") {
                this.openFile(`${outputFilesDir}/${file}`);
              }
            });
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  },

  pluginAction(subcommand) {
    return new Promise((resolve, reject) => {
        let result = "";
        let DESCAMPATH = atom.config.get('descam.DESCAM_PATH');
        if (DESCAMPATH !== "" && DESCAMPATH !== undefined && DESCAMPATH.includes("/bin")) {
          DESCAMPATH = atom.config.get('descam.DESCAM_PATH');
        } else if (this.checkEnvVar()) {
          DESCAMPATH = process.env.DESCAM;
        } else {
          let errorMsg = "Please make sure that the correct path to the DESCAM bin folder in the DeSCAM package settings or as DESCAM environment variable is set!";
          atom.notifications.addError(errorMsg)
          reject(errorMsg);
        }
        if (DESCAMPATH.includes("/bin")) {
          this.activePane = atom.workspace.getActivePane();
          currentTab = atom.workspace.getActivePaneItem();

          editor = atom.workspace.getActiveTextEditor();
          if (editor !== undefined) {
            lang = editor.getGrammar().name;
            if (lang === "C++" || lang === "C") {
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
                this.outputPath = this.makeDirPath(filePath);
                exec(`mkdir ${this.outputPath}/DESCAM_OUTPUT`);
                cmd = `${DESCAMPATH}/SCAM -f ${filePath} -o ${this.outputPath}/DESCAM_OUTPUT  -${subcommand}`;
              } else {
                cmd = `${DESCAMPATH}/SCAM -h`;
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
    let txtEditor = atom.workspace.buildTextEditor({
      autoHeight: false
    });
    let item = this.activePane.addItem(txtEditor);
    this.activePane.activateItem(item);
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
      const result = await this.runCmd(cmd);
      if (result.includes("exists")) return true;
      else return false;

    },

    async getFilesInDir(pathToFile) {
        let cmd = `ls ${pathToFile}`;
        let result = await this.runCmd(cmd);
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
};
