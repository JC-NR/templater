<template>
  <ph-window>
    <ph-toolbar type="header">
      <ph-toolbar-actions>
        <ph-button-group class="pull-left">
          <ph-button size="sm">
            <ph-icon icon="folder"></ph-icon>
          </ph-button>
          <ph-button size="sm">
            <ph-icon icon="quote"></ph-icon>
          </ph-button>
          <ph-button size="sm">
            <ph-icon icon="tools"></ph-icon>
          </ph-button>
        </ph-button-group>
      </ph-toolbar-actions>
    </ph-toolbar>
    <ph-window-content>
      <ph-pane-group>
        <ph-pane size="sm" :sidebar="true" style="overflow-y:auto;">
        </ph-pane>
        <ph-pane>
          <ph-tab-group>
            <ph-tab-item/>
          </ph-tab-group>
        </ph-pane>
      </ph-pane-group>
    </ph-window-content>
    <ph-toolbar type="footer"></ph-toolbar>
  </ph-window>
</template>

<script>
export default {
  name: 'MainWindow',
  props: {
    msg: String
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
