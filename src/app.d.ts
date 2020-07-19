declare global {
  /**
   * App-specific types.
   */

  // Text Editor
  type Mark = { type: 'bold' | 'italic' | 'strike' | 'underline' }
  type Attrs = { order: number }
  type ContentBlock = {
    type: 'paragraph' | 'text' | 'hard_break' | 'bullet_list' | 'horizontal_rule',
    content?: ContentBlock[],
    attrs?: Attrs,
    text?: string,
    marks?: Mark[]
  }
}


export {
  Mark,
  Attrs,
  ContentBlock
}