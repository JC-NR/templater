<template>
  <ph-window>
    <ph-toolbar type="header">
      {{ProjectName}}{{(ProjectName && hasMod())?"*":""}}
    </ph-toolbar>
    <ph-window-content>
      <ph-pane-group>
        <ph-pane size="sm" :sidebar="true"  :class="{hidden: !shown.sidebar}" style="overflow-y:auto;">
          <VueTree :editors="Editors" @clicknode="nodeClick" @actionset="setTreeActions"/>
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
              @cancel="toHide(ID)">
              {{Editors[ID].Title}}{{Changed[ID]?"*":""}}
            </ph-tab-item>
          </ph-tab-group>
          <div v-for="(Edi, ID) in Editors" :name="ID" :key="ID" class="expanded" :class="{hidden: selEdit!=ID}" >
            <img v-if="Edi.Type === 'IMG'" :src="makeImg(ID)" alt="ID" class="Image"/>
            <div v-else-if="Edi.Type === 'META'">
              Title : <input type="text" v-model="Edi.Content.title"><br/>
              From : <input type="text" v-model="Edi.Content.from"><br/>
              To : <input type="text" v-model="Edi.Content.to"><br/>
              Bcc : <input type="text" v-model="Edi.Content.bcc"><br/>
            </div>
            <editor
              v-else
              :ref="ID"
              v-model="Edi.Content"
              @init="editorInit"
              @input="setChanged"
              :lang="Edi.Lang"
              theme="chrome"
            >
            </editor>
          </div>
        </ph-pane>
      </ph-pane-group>
    </ph-window-content>
    <ph-toolbar type="footer"></ph-toolbar>
    <div class="hidden">{{hasMod()}} / {{counter}}</div>
  </ph-window>
</template>

<script>
import fs from "fs"
import * as path from 'path'
import VueTree from "./VueTree.vue";
import Hjson from "hjson";
import HandleBars from "handlebars";
import { remote, ipcRenderer } from "electron";
import xml2js from "xml2js";
import request from "request";
import * as Promise from 'bluebird';
const { getCurrentWindow, dialog, Menu, MenuItem, shell } = remote

export default {
  components: {
    VueTree,
    editor: require('vue2-ace-editor')
  },

  name: 'MainWindow',

  data() {
    return {
      URL: 'http://docker:1880',
      shown: {
        sidebar: true
      },
      counter: 0,
      EditorList: [],
      Editors: {},
      TreeActions: {},
      ProjectName: '',
      selEdit: '',
      Changed: {}
    }
  },

  computed: {
  },

  methods: {
    hasMod: function() {
      let vm = this;

      for (let ID in vm.Changed) {
        if (vm.Changed[ID]) {
          return true;
        }
      }
      return false;
    },
    NewProject: function() {
      this.ProjectName = "Nouveau";
    },
    OpenProject: function() {
      // Xml
    },
    SaveProject: function() {},
    CloseProject: function() {
      let vm = this;
      if (vm.ProjectName) {
        Object.keys(vm.Editors).forEach(ID => vm.toClose(ID));
      }
      vm.ProjectName = "";
    },

    ToRedway: function() {
      let vm = this;

      if (vm.ProjectName) {
        Promise.resolve()
          .then(() => Object.keys(vm.Editors).map(ID => {
            let ed = vm.Editors[ID];
            return {
              project: vm.ProjectName,
              type: ed.Type,
              name: ed.Ref,
              content: ed.Content,
              filename: ed.Title
            }
          }))
          .map(data => vm.RWSend(data).delay(100))
          .delay(1000)
          .then(() => vm.RWInit())
          .catch(error => console.log(error));
      }
    },

    RWSend: function(data) {
      let vm = this;
      return new Promise((resolve,reject) => {
        request.post({ url: vm.URL + '/Mail/Template', json: data }, function(e,r,b) {
          if (e) return reject(e);
          return resolve(b);
        });
      });
    },

    RWInit: function(data) {
      let vm = this;
      return new Promise((resolve,reject) => {
        request.get({ url: vm.URL + '/Mail/Init', qs: data }, function(e,r,b) {
          if (e) return reject(e);
          return resolve(b);
        });
      });
    },
    
    nodeClick: function(e,n) {
      let vm = this;
      let ID = path.normalize(n.data.path);
      vm.toShow(ID);
      vm.selEdit = ID;
    },
    makeImg: function(ID) {
      return 'data:image/png;base64,' + this.Editors[ID].Content;
    },
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

    toShow: function(ID) {
      let vm = this;
      if (vm.EditorList.indexOf(ID) === -1) {
        vm.EditorList.push(ID);
      }
    },
    toHide: function(ID) {
      let vm = this;
      let Sel = "";
      for(let item in vm.EditorList) {
        if (vm.EditorList[item] != ID ) {
          Sel = vm.EditorList[item];
        }
      }
      vm.hideEdit({ ID });
      vm.Select(Sel);
    },

    toClose: function(ID) {
      let vm = this;
      let Sel = "";
      for(let item in vm.EditorList) {
        if (vm.EditorList[item] != ID ) {
          Sel = vm.EditorList[item];
        }
      }
      vm.deleteEdit({ ID });
      vm.Select(Sel);
    },

    toOpen: function(fic) {
      let vm = this;
      if (!vm.ProjectName) return;
      let fileName = path.normalize(fic);
      let ext = path.extname(fileName);

      let typ, lng = '';
      switch(ext.toLowerCase()) {
        case '.hjson':
        case '.json':
          typ = 'JSON';
          lng = 'hjson';
          break;
        case '.jpg':
        case '.jpeg':
        case '.png':
          typ = 'IMG';
          break;
        case '.xml':
          typ = 'META';
          break;
        case '.htx':
          typ = 'PART';
          lng = 'handlebars';
          break;
        default:
          typ = 'TPL';
          lng = 'handlebars';
      }

      let data;
      if (typ === 'IMG') {
        data = Buffer.from(fs.readFileSync(fileName)).toString('base64')
      } else if (typ === 'META') {
        let xml = fs.readFileSync(fileName, 'utf8');
        var parser = new xml2js.Parser({explicitArray:false});
        parser.parseString(xml, function (err, result) {
          // console.dir(result);
          if (result.meta) {
            data = result.meta;
          } else {
            data = { from: "", to:"", title:"", bcc: ""};
          }
        });
      } else {
        data = fs.readFileSync(fileName, 'utf8');
      }

      let ID = fileName;

      vm.createEdit( {
        ID: ID,
        Title: path.basename(ID),
        Ref: (vm.ProjectName ? vm.ProjectName + '/' : "") + path.basename(ID).replace(/\.[^/.]+$/, ""),
        Path: ID,
        Type: typ,
        Lang: lng,
        New: false,
        Content: data
      });
      vm.selEdit = ID;
    },

    toLoad: function() {
      var vm = this;
      var fileNames = dialog.showOpenDialog(getCurrentWindow(), {
        properties: [
          'openFile'
        ],
        filters: [
          { name: 'Templates', extensions: ['html','htm'] },
          { name: 'Communs', extensions: ['htx'] },
          { name: 'Meta-données', extensions: ['xml'] },
          { name: 'Données de test', extensions: ['json','hjson'] },
          { name: 'Images', extensions: ['jpg','jpeg','png'] },
        ]
      });

      if (fileNames !== undefined) {
        vm.toOpen(fileNames[0]);
      }
    },

    toHTM: function() {
      let vm = this;
      if ('TPL' in vm.TreeActions) {
        // Recup JSON
        let hjs = ('JSON' in vm.TreeActions) ? vm.Editors[vm.TreeActions['JSON']].Content : '{IN:{}}';
        let js = Hjson.parse(hjs);

        // Register Partials
        for (let edIN in vm.Editors) {
          let edtr = vm.Editors[edIN];
          if (edtr.Type === 'PART') {
            HandleBars.registerPartial(edtr.Ref, edtr.Content);
          }
        }

        // Recup Template
        let template = HandleBars.compile(vm.Editors[vm.TreeActions['TPL']].Content);
        let result = template(js);

        // Interception Images
        var CID = /cid:(.*?)["']/gm;
        var CIDS;
        var done = {};

        while ((CIDS = CID.exec(result)) !== null) {
          // console.dir(CIDS);
          if (!(CIDS[1] in done)) {
            for (let ID in vm.Editors) {
              if ((vm.Editors[ID].Type === 'IMG') && (CIDS[1] !== "") && (vm.Editors[ID].Title === CIDS[1])) {
                result = result.replace(new RegExp('cid:'+CIDS[1],'g'), vm.makeImg(ID));
              }
            }
            done[CIDS[1]] = true;
          }
        }
        console.log(result);
        ipcRenderer.send('show-visu', result);
      }
    },

    toSave: function() {
      var vm = this;
      let Sel = vm.selEdit;
      if (Sel != "") {
        let Item = vm.Editors[Sel];
        // if (vm.Changed[Sel]) {
            // eslint-disable-next-line
          if(Item.Type === 'IMG') {

          } else if (Item.Type === 'META') {
            var builder = new xml2js.Builder();
            var xml = builder.buildObject({meta:{...Item.Content}});
            fs.writeFileSync(Item.Path, xml);
          } else {
            fs.writeFileSync(Item.Path, Item.Content);
          }
          vm.Changed[Sel] = false;
          vm.$forceUpdate();
        // }
      }
    },

    setChanged: function(content) {
      let vm = this;
      vm.Changed[vm.selEdit] = true;
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
    hideEdit(payload) {
      var vm = this;
      vm.EditorList = vm.EditorList.filter(value => value !== payload.ID)
    },
    deleteEdit(payload) {
      var vm = this;
      vm.EditorList = vm.EditorList.filter(value => value !== payload.ID)
      vm.$delete(vm.Editors, payload.ID);
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
      {
        label: 'Projet',
          submenu: [
            { label:'Nouveau projet', click: vm.NewProject },
            { label:'Ouvrir projet', click: vm.OpenProject },
            { label:'Sauver projet', click: vm.SaveProject },
            { label:'Fermer projet', click:vm.CloseProject },
        ]
      },
      {
        label: 'Redway',
          submenu: [
            { label:'Envoyer et mettre en ligne', click: vm.ToRedway },
        ]
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    ipcRenderer.on('fic-drop', function(ev, file) {
      if (fs.existsSync(file)) {
        if (fs.lstatSync(file).isDirectory()) {
          vm.CloseProject();
          vm.ProjectName = path.basename(file);
          fs.readdirSync(file).forEach(fic => {
            vm.toOpen(file + '/' + fic);
          })
        } else {
          vm.toOpen(file);
        }
      }
      
    });

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
.Image {
  max-width: 100%;
  max-height: calc(100% - 26px) !important;
}
</style>
