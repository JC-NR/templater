<template>
  <ph-window>
    <ph-toolbar type="header">
    </ph-toolbar>
    <ph-window-content>
      <ph-pane-group>
        <ph-pane size="sm" :sidebar="true"  :class="{hidden: !shown.sidebar}" style="overflow-y:auto;">
          <VueTree :editors="Editors" @actionset="setTreeActions"/>
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
              @input="setChanged"
              :lang="Editors[ID].Type"
              theme="chrome"
            >
            </editor>
          </div>
        </ph-pane>
      </ph-pane-group>
    </ph-window-content>
    <ph-toolbar type="footer"></ph-toolbar>
    <div class="hidden">{{hasMod}} / {{counter}}</div>
  </ph-window>
</template>

<script>
import fs from "fs"
import * as path from 'path'
import VueTree from "./VueTree.vue";
import Hjson from "hjson";
import HandleBars from "handlebars";
import { remote, ipcRenderer } from "electron"
const { getCurrentWindow, dialog, Menu, MenuItem, shell } = remote
require('electron-disable-file-drop');

export default {
  components: {
    VueTree,
    editor: require('vue2-ace-editor')
  },

  name: 'MainWindow',

  data() {
    return {
      shown: {
        sidebar: true
      },
      counter: 0,
      EditorList: [],
      Editors: {},
      TreeActions: {},
      selEdit: ''
    }
  },

  methods: {
    setTreeActions: function(payload) {
      let vm = this;
      vm.$set(vm, 'TreeActions', payload);
    },

    editorInit: function () {
      require('brace/ext/language_tools') //language extension prerequsite...
      require('brace/mode/handlebars')    //language
      require('brace/mode/hjson')    //language
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

        var data = fs.readFileSync(fileName, 'utf8');
        var ID = fileName;
        var ext = path.extname(ID);
        vm.createEdit( {
          ID: ID,
          Title: path.basename(ID),
          Path: ID,
          Type: ( ( ext.toLowerCase() === '.json' ) ? 'hjson' : 'handlebars' ),
          New: false,
          Changed: false,
          Content: data
        });
        vm.selEdit = ID;
      }
    },

    toHTM: function() {
      let vm = this;
      if ('handlebars' in vm.TreeActions) {
        let hjs = ('hjson' in vm.TreeActions) ? vm.Editors[vm.TreeActions['hjson']].Content : '{IN:{}}';
        let js = Hjson.parse(hjs);

        let template = HandleBars.compile(vm.Editors[vm.TreeActions['handlebars']].Content);
        let result = template(js);
        ipcRenderer.send('show-visu', result);
      }
    },

    toSave: function() {
      var vm = this;
      let Sel = vm.selEdit;
      if (Sel != "") {
        let Item = vm.Editors[Sel];
        if (Item.Changed) {
            // eslint-disable-next-line
          fs.writeFileSync(Item.Path, Item.Content);
          vm.modifyEdit( { ID: Sel, Changed: false })
          vm.$forceUpdate();
        }
      }
    },

    hasMod: function() {
      let vm = this;
      // eslint-disable-next-line
      let ct = vm.counter++;
      var mod  = vm.EditorList.reduce((prev, key) => (prev || vm.Editors[key].Changed), false);
      return mod;
    },

    setChanged: function(content) {
      let vm = this;
      vm.modifyEdit({ ID: vm.selEdit, Changed: true });
      vm.$forceUpdate();
    },

    createEdit(payload) {
      var vm = this;
      vm.$set(vm.Editors,payload.ID,payload);
      if (vm.EditorList.indexOf(payload.ID) === -1)
        vm.EditorList.push(payload.ID);
    },
    modifyEdit(payload) {
      var vm = this;
      vm.$set(vm.Editors,payload.ID,{...vm.Editors[payload.ID], ...payload});
    },
    deleteEdit(payload) {
      var vm = this;
      vm.EditorList = vm.EditorList.filter(value => value !== payload.ID)
      vm.$Delete(vm.Editors, payload.ID);
    },
  },

  mounted: function () {
    var vm = this;

    const template = [
      {
        label: 'Fichier',
          submenu: [
            { label:'Importer Fichier', accelerator: 'CommandOrControl+O', click: vm.toLoad },
            { label:'Enregistrer', accelerator: 'CommandOrControl+S', click: vm.toSave },
            {type: 'separator'},
            { label:'Visualiser', accelerator: 'CommandOrControl+E', click: vm.toHTM },
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
