<template lang="html">
    <SlVueTree
      ref="MyTree"
      :value="paths"
      @nodeclick="nodeClick"
      @nodedblclick="nodeDblClick"
      @nodecontextmenu="nodeContextMenu">
      <template slot="toggle" slot-scope="{ node }">
        <span v-if="!node.isLeaf">
          <ph-icon icon="right-open" v-if="!node.isExpanded"></ph-icon>
          <ph-icon icon="down-open"  v-else-if="node.isExpanded"></ph-icon>
        </span>
      </template> 
      <template slot="sidebar" slot-scope="{ node }">
        <span v-if="node.data && node.data.action">
          <ph-icon icon="check"></ph-icon>
        </span>
      </template>
    </SlVueTree>
</template>

<script type="text/javascript">

export default {
  name: "VueTree",
  components: {
    SlVueTree: require('sl-vue-tree')
  },

  data() {
    return {
      paths: []
    }
  },

  props: {
    editors: {
      // Folder Name.
      type: Object,
      default: {}
    },
  },

  watch: {
    editors: function (New, Old) {
      this.makeTree();
    }
  },

  methods: {
    nodeClick: function(node, event) {
      let vm = this;
      if (node.isLeaf) {
        vm.$emit('clicknode', event, node);
      }
    },
    nodeDblClick: function(node, event) {
      let vm = this;
      if (node.isLeaf && node.data.type !== 'IMG' && node.data.type !== 'PART' && node.data.type !== 'META') {
        let actions = {};
        let typ = node.data.type;
        let pat = node.data.path;
        actions[typ] = pat;
        vm.$refs.MyTree.traverse((node, nodeModel, path) => {
          if (node.data.type === typ) {
            vm.$set(nodeModel.data, 'action', (node.data.path === pat));
          } else {
            if (node.data.action) {
              actions[node.data.type] = node.data.path;
            }
          }
        })
        vm.$emit('actionset', actions);
      }
    },
    nodeContextMenu: function(node, event) {
      let vm = this;
      if (node.isLeaf) {
        vm.$emit('contextmenunode', event, node);
      }
    },
    sortTree: function(a,b) {
      if (a.data.type === b.data.type) {
        if (a.title > b.title) { return 1; }
        if (a.title < b.title) { return -1; }
        return 0;
      } else {
        if (a.data.type === "DIRECTORY") { return -1; }
        else { return 1; }
      }
    },
    makeTree: function() {
      let vm = this;
      let swt = { 'JSON': { act: true, tab: [] }, 'TPL': { act: true, tab: [] }, 'META': { act: true, tab: [] }, 'PART': { act: true, tab: [] }, 'IMG': { act: true, tab: [] }};
      let actions = {};

      for(let ID in vm.editors) {
        let item = vm.editors[ID]
        let TYPE = item.Type
        let action = false;
        if (swt[TYPE].act) {
          if ((TYPE !== 'IMG') && (TYPE !== 'PART') && (TYPE !== 'META')) {
            actions[TYPE] = item.Path;
            action = true;
          }
          swt[TYPE].act = false;
        }
        swt[TYPE].tab.push({
          title: item.Title, 
          isLeaf: true, 
          isExpanded: true,
          isDraggable: false,
          isSelectable: false,
          data: {
            path: item.Path,
            type: item.Type,
            action: action
          }
        });
      }

      vm.paths = [
        {
          title: "Meta-données", 
          isLeaf: false, 
          isExpanded: true,
          isDraggable: false,
          isSelectable: false,
          children: swt['META'].tab, 
          data: { 
              type: "DIRECTORY",
          }
        },
        {
          title: "Templates", 
          isLeaf: false, 
          isExpanded: true,
          isDraggable: false,
          isSelectable: false,
          children: swt['TPL'].tab, 
          data: { 
              type: "DIRECTORY",
          }
        },
        {
          title: "Communs", 
          isLeaf: false, 
          isExpanded: true,
          isDraggable: false,
          isSelectable: false,
          children: swt['PART'].tab, 
          data: { 
              type: "DIRECTORY",
          }
        },
        {
          title: "Jeux de test", 
          isLeaf: false, 
          isExpanded: true,
          isDraggable: false,
          isSelectable: false,
          children: swt['JSON'].tab, 
          data: { 
              type: "DIRECTORY",
          }
        },
        {
          title: "Images", 
          isLeaf: false, 
          isExpanded: true,
          isDraggable: false,
          isSelectable: false,
          children: swt['IMG'].tab, 
          data: { 
              type: "DIRECTORY",
          }
        },
      ];
      vm.$emit('actionset', actions);
    },

  },

  mounted () {
    this.makeTree();
  },
}
</script>

<style>
.vue-file-tree-contextmenu {
    position: absolute;
    background-color: white;
    color: black;
    border-radius: 2px;
    cursor: pointer;
}

.vue-file-tree-contextmenu > div {
    padding: 10px;
}

.vue-file-tree-contextmenu > div:hover {
    background-color: rgba(100, 100, 255, 0.5);
}

#vue-file-tree {
    height: 100%;
}

.sl-vue-tree {
    position: relative;
    cursor: default;
    user-select: none;
}

.sl-vue-tree.sl-vue-tree-root {
    /* border: 1px solid rgb(9, 22, 29);
    background-color: rgb(9, 22, 29);
    color: rgba(255, 255, 255, 0.5);
    border-radius: 3px; */
}

.sl-vue-tree-root > .sl-vue-tree-nodes-list {
    overflow: hidden;
    position: relative;
    padding-bottom: 4px;
}

.sl-vue-tree-selected > .sl-vue-tree-node-item {
    /* background-color: #4a4c4d;
    color: white; */
}

.sl-vue-tree-node-item:hover,
.sl-vue-tree-node-item.sl-vue-tree-cursor-hover {
    /* color: white; */
}

.sl-vue-tree-node-item {
    position: relative;
    display: flex;
    flex-direction: row;

    padding-left: 10px;
    padding-right: 10px;
    line-height: 28px;
    border: 1px solid transparent;
}

.sl-vue-tree-node-item.sl-vue-tree-cursor-inside {
    /* border: 1px solid rgba(255, 255, 255, 0.5); */
}

.sl-vue-tree-gap {
    width: 15px;
    min-height: 1px;

}

.sl-vue-tree-toggle {
    display: inline-block;
    text-align: left;
    width: 10px;
}

.sl-vue-tree-sidebar {
    margin-left: auto;
}

.sl-vue-tree-cursor {
    position: absolute;
    /* border: 1px solid rgba(255, 255, 255, 0.5); */
    height: 1px;
    width: 100%;
}

.sl-vue-tree-drag-info {
    position: absolute;
    background-color: rgba(0,0,0,0.5);
    opacity: 0.5;
    margin-left: 20px;
    padding: 5px 10px;
}
</style>
