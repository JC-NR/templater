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
              :title="Editors[ID].Path">
              {{Editors[ID].Title}}{{Editors[ID].Changed?"*":""}}
            </ph-tab-item>
          </ph-tab-group>
        </ph-pane>
      </ph-pane-group>
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

    </ph-window-content>
    <ph-toolbar type="footer"></ph-toolbar>
  </ph-window>
</template>

<script>
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
  height: calc(100% - 25px) !important;
}
.stayFit {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
</style>
