import { defineComponent, h } from 'vue'

export const Badge = defineComponent({
  name: 'Badge',
  props: {
    variant: {
      type: String,
      default: 'default'
    }
  },
  setup(props, { slots }) {
    return () => h('span', {
      class: [
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset',
        props.variant === 'default' 
          ? 'bg-primary/10 text-primary ring-primary/20' 
          : 'bg-muted text-muted-foreground ring-muted/20'
      ]
    }, slots.default?.())
  }
}) 