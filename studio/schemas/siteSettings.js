import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'About Page',
  type: 'document',
  fields: [
    defineField({
      name: 'greetingLine2',
      title: 'Greeting Line 2',
      type: 'string',
      description: 'The second line on the About page, e.g. " a photographer and mixed-media artist."',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'About Page'}
    },
  },
})
