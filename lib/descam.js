'use babel';

//import DescamView from './descam-view';
import {
  CompositeDisposable
} from 'atom';
import {
  exec
} from 'child_process';
import dotenv from 'dotenv';

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

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'descam:toggle': () => this.toggle()
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'descam:help': () => this.help()
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'descam:printITL': () => this.printITL()
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'descam:printAML': () => this.printAML()
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'descam:printVHDL': () => this.printVHDL()
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'descam:printCFGDot': () => this.printCFGDot()
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {},

  toggle() {

  },

  printITL() {
    this.pluginAction("-PrintITL").then((result) => {
      if (result !== "") {
        this.createNewTab(result);
        let outputFile1 = `${this.outputPath}/DESCAM_OUTPUT/PrintITL/Example.vhi`;
        if (this.checkIfFileExists(outputFile1)) {
          this.openFile(outputFile1);
        }
        let outputFile2 = `${this.outputPath}/DESCAM_OUTPUT/PrintITL/Example_functions.vhi`;
        if (this.checkIfFileExists(outputFile2)) {
          this.openFile(outputFile2);
        }
      }
    });
  },
  printAML() {
    this.pluginAction("-PrintAML").then((result) => {
      if (result !== "") {
        this.createNewTab(result);
        let outputFile1 = `${this.outputPath}/DESCAM_OUTPUT/PrintAML/Example.aml`;
        if (this.checkIfFileExists(outputFile1)) {
          this.openFile(outputFile1);
        }
      }
    });
  },
  printVHDL() {
    this.pluginAction("-PrintVHDL").then((result) => {
      if (result !== "") {
        this.createNewTab(result);
        let outputFile1 = `${this.outputPath}/DESCAM_OUTPUT/PrintVHDL/Example.vhd`;
        if (this.checkIfFileExists(outputFile1)) {
          this.openFile(outputFile1);
        }
      }
    });
  },
  printCFGDot() {
    this.pluginAction("-PrintCFGDot").then((result) => {
      if (result !== "") {
        this.createNewTab(result);
        let outputFile1 = `${this.outputPath}/DESCAM_OUTPUT/PrintCFGDot/Example.dot`;
        if (this.checkIfFileExists(outputFile1)) {
          this.openFile(outputFile1);
        }
      }
    });
  },

  pluginAction(subcommand) {
    return new Promise((resolve, reject) => {
      let result = "";
      let DESCAMPATH = atom.config.get('descam.DESCAM_PATH');
      if ( DESCAMPATH!== "" && DESCAMPATH !== undefined  && DESCAMPATH.includes("/bin")) {
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
          if (lang === "C++") {
            filePath = currentTab.buffer.file.path;
            if ((filePath !== null || filePath !== undefined)) {
              atom.notifications.addInfo("Processing!");

              this.outputPath = this.makeDirPath(filePath);
              exec(`mkdir ${this.outputPath}/DESCAM_OUTPUT`);
              let cmd = `${DESCAMPATH}/SCAM -f ${filePath} -o ${this.outputPath}/DESCAM_OUTPUT  ${subcommand}`;
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

  async help() {

    let DESCAMPATH = atom.config.get('descam.DESCAM_PATH');
    if ( DESCAMPATH!== "" && DESCAMPATH !== undefined  && DESCAMPATH.includes("/bin")) {
      DESCAMPATH = atom.config.get('descam.DESCAM_PATH');
    } else if (this.checkEnvVar() && process.env.DESCAM.includes("/bin")) {
      DESCAMPATH = process.env.DESCAM;
    } else {
      atom.notifications.addError("Please make sure that the correct path to the DESCAM bin folder in the DeSCAM package settings or as DESCAM environment variable is set!");
        return;
      }
      let cmd = `${DESCAMPATH}/SCAM -h`;
      let result = await this.runCmd(cmd);
      if (result !== "" || result !== undefined) {
        this.activePane = atom.workspace.getActivePane();
        this.createNewTab(result);
      }
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
          let cmd = `test -f ${pathToFile} && echo "exist" || echo "doesn't exist"`;
          return await this.runCmd(cmd).then((result) => {
            if (result === "exist") return true;
            else return false;
          });
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
