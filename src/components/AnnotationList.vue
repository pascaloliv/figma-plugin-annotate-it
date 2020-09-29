<template>
  <div class="AnnotationList">
    <header>
      <div class="title">
        <div 
          class="title-content" 
          contenteditable 
          @keydown.enter="handleTitleChangeDone"
          @input="handleTitleChange"
          ref="titleContent"
          v-once
          v-text="allData.pluginData.connectedFrameAliasName || 'My annotations'" 
        />
        <Icon class="title-icon" iconName="edit" @click.native="handleEditIconClick" />
      </div>

      <Button 
        buttonType="primary" 
        @click="addAnnotDataNewAnnot"
        v-tooltip.left="`Add a new annotation`">

        <Icon iconName="plus" />
        New annotation
      </Button>
    </header>

    <main class="scrollContainer" ref="scrollContainer">
      <Container 
        @drop="onDrop" 
        drag-handle-selector=".annotationItem-dragHandleButton">

        <Draggable v-for="(annotation, i) in data.filter(annotation => !annotation.isDeleted)" :key="annotation.id">
          <div class="draggable-item">
            <transition name="slide" :appear="true">
              <AnnotationItem 
                :itemKey="i"
                @removeAnnotation="removeAnnotation"
                v-model="data[i]"
              />
            </transition>
          </div>
        </Draggable>
      </Container>
    </main>
  </div>
</template>

<script>
  import AnnotationItem from '@/components/AnnotationItem'
  import Button from '@/components/ui/Button'
  import Icon from '@/components/ui/Icon'
  import { Container, Draggable } from 'vue-smooth-dnd'
  import { store, mutations } from '@/store'
  import { generateAnnotItemObject } from '@/utils/utils'


  export default {
    components: { AnnotationItem, Container, Draggable, Button, Icon },

    computed: {
      'allData'() { return store.annotData.find(el => el.id === this.selectedWrapperFrameId) },
      'data'() { return this.allData.annotData },
      'data_str'() { return JSON.stringify(this.data) },
      'watchAnnotations': { get: () => store.watchAnnotations, set: mutations.setWatchAnnotations },
      'selectedWrapperFrameId': () => store.selectedWrapperFrameId
    },

    methods: {
      async toggleWatcher( newVal ) {
        await this.$nextTick()
        this.watchAnnotations = newVal
        return Promise.resolve()
      },

      async removeAnnotation( itemId ) {
        const annotItem = this.data.find(item => item.id === itemId)
        mutations.updateAnnotDataAnnot(this.selectedWrapperFrameId, itemId, { ...annotItem, isDeleted: true })

        // Now "really" delete it.
        await this.toggleWatcher(false)
        mutations.updateAnnotDataAnnot(this.selectedWrapperFrameId, itemId, null, true) 
        await this.toggleWatcher(true)
      },

      onDrop( dropResult ) {
        mutations.updateAnnotDataAnnots(this.selectedWrapperFrameId, onDrop(this.data, dropResult))
      },

      async addAnnotDataNewAnnot() {
        mutations.addAnnotDataNewAnnot(this.selectedWrapperFrameId, generateAnnotItemObject())

        await this.$nextTick()
        this.$refs.scrollContainer.scrollTo({ // Scroll to bottom
          top: this.$refs.scrollContainer.scrollHeight, behavior: 'smooth'
        })
      },

      handleEditIconClick() {
        this.$refs.titleContent.focus()
      },

      handleTitleChange( e ) {
        let newVal = e.target.innerText
        this.allData.pluginData.connectedFrameAliasName = newVal

        parent.postMessage({ pluginMessage: {
          type: 'pushAnnotWrapperTitleChange', 
          value: { 
            wrapperFrameId: this.selectedWrapperFrameId,
            newVal
          }
        }}, '*')
      },

      handleTitleChangeDone( e ) {
        e.preventDefault()
        this.$refs.titleContent.blur()
      }
    },

    watch: {
      data_str( newAnnots_str, oldAnnots_str ) {
        if (!this.watchAnnotations) return
        parent.postMessage({ pluginMessage: {
          type: 'pushAnnotChanges', 
          value: { 
            wrapperFrameId: this.selectedWrapperFrameId,
            newAnnots: JSON.parse(newAnnots_str), 
            oldAnnots: JSON.parse(oldAnnots_str)
          }
        }}, '*')
      }
    }
  }

  /**
   * Re-sorts the given array based on a drop-event.
   * @param arr The original array.
   * @param dropResult The data of the new Result.
   * @returns The new, correctly sorted array.
   */
  const onDrop = ( arr, dropResult ) => {
    const { removedIndex, addedIndex, payload } = dropResult
    if (removedIndex === null && addedIndex === null)
      return arr

    const result = [...arr]
    let itemToAdd = payload

    if (removedIndex !== null)
      itemToAdd = result.splice(removedIndex, 1)[0]

    if (addedIndex !== null)
      result.splice(addedIndex, 0, itemToAdd)
    
    return result
  }
</script>

<style lang="scss" scoped>
  .smooth-dnd-container.vertical > .smooth-dnd-draggable-wrapper {
    overflow: visible;
  }

  .AnnotationList {
    position: relative;
    display: grid;
    height: 100vh;
    grid-template-rows: min-content 1fr min-content;

    header {
      height: 56px;
      border-bottom: 1px solid $color--background-silver;
      background: $color--background-white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;

      .title {
        display: flex;
        align-items: center;

        &-content {
          // Fake input
          @include font(13, 'bold');
          border-radius: 3px;
          padding: 4px 8px;
          margin-left: -8px;
          position: relative;
          z-index: 1;

          &:hover, &:active, &:focus {
            box-shadow: inset 0 0 0 1px var(--color--special-black-1);
          }
        }

        &-icon {
          opacity: .33;
          margin-left: -6px;
          position: relative;
          z-index: 0;
        }
      }
    }

    main {
      overflow: hidden;
      padding: 24px 0 0;
      overflow-y: scroll;
      position: relative;
      z-index: 0;
    }
  }
</style>