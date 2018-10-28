<template>
  <ph-window>
    <ph-toolbar type="header">
    </ph-toolbar>
    <ph-window-content>
      <ph-pane-group>
        <ph-pane size="sm" :sidebar="true"  :class="{hidden: !shown.sidebar}" style="overflow-y:auto;">
        </ph-pane>
        <ph-pane>
          <ph-tab-group>
            <ph-tab-item
              v-for="ID in EditorList"
              class="stayFit"
              :key="ID"
              :active="ID==selEdit"
              :title="Editors[ID].Path"
              @click.native="Select(ID)"
              @cancel="toClose(ID)">
              {{Editors[ID].Title}}{{Editors[ID].Changed?"*":""}}
            </ph-tab-item>
          </ph-tab-group>
          <div v-for="ID in EditorList" :name="ID" :key="ID" class="expanded" :class="{hidden: selEdit!=ID}" >
            <editor
              :ref="ID"
              v-model="Editors[ID].Content"
              @init="editorInit"
              lang="markdown"
              theme="chrome"
            >
            </editor>
          </div>
        </ph-pane>
      </ph-pane-group>
    </ph-window-content>
    <ph-toolbar type="footer"></ph-toolbar>
  </ph-window>
</template>

<script>
import fs from "fs"
import * as path from 'path'
import { remote, ipcRenderer } from "electron"
const { getCurrentWindow, dialog, Menu, MenuItem, shell } = remote
require('electron-disable-file-drop');

export default {
  components: {
    // VueTree,
    editor: require('vue2-ace-editor')
  },

  name: 'MainWindow',

  data() {
    return {
      shown: {
        sidebar: true
      },
      EditorList: [],
      Editors: {},
      selEdit: ''
    }
  },

  methods: {
    editorInit: function () {
      require('brace/ext/language_tools') //language extension prerequsite...
      require('brace/mode/markdown')    //language
      require('brace/theme/chrome')
      require('brace/ext/searchbox')
    },

    Select: function(id) {
      let vm = this;
      vm.selEdit = id;
    },

    toClose: function(ID) {
      let vm = this;
      let Sel = "";
      for(let item in vm.Editors) {
        if (item != ID ) {
          Sel = item;
        }
      }
      vm.selEdit = Sel;
      vm.deleteEdit({ ID });
    },

    toLoad: function() {
      var vm = this;
      var fileNames = dialog.showOpenDialog(getCurrentWindow(), {
        properties: [
          'openFile'
        ],
        filters: [
          { name: 'Template', extensions: ['html','htm','htx'] },
          { name: 'Données de test', extensions: ['json','hjson'] },
        ]
      });

      if (fileNames !== undefined) {
        var fileName = fileNames[0];
        fs.readFile(fileName, 'utf8', function (err, data) {
          var ID = fileName;
          vm.createEdit( {
            ID: ID,
            Title: path.basename(ID),
            Path: ID,
            New: false,
            Changed: false,
            Content: data
          });
          vm.selEdit = ID;
        });
      }
    },

    createEdit(payload) {
      var vm = this;
      vm.Editors[payload.ID] = payload;
      if (vm.EditorList.indexOf(payload.ID) === -1)
        vm.EditorList.push(payload.ID);
    },
    modifyEdit(payload) {
      var vm = this;
      vm.Editors[payload.ID] = {...vm.Editors[payload.ID], ...payload};      
    },
    deleteEdit(payload) {
      var vm = this;
      vm.EditorList = vm.EditorList.filter(value => value !== payload.ID)
      delete vm.Editors[payload.ID];
    },
  },

  mounted: function () {
    var vm = this;

    const template = [
      {
        label: 'Fichier',
          submenu: [
            { label:'Importer Fichier', accelerator: 'CommandOrControl+O', click: vm.toLoad },
            {type: 'separator'},
            { label:'Quitter', role: 'quit'}
        ]
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

  }

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.hidden {
  display: none;
}
.expanded {
  width: 100%;
  height: calc(100% - 26px) !important;
}
.stayFit {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
</style>
