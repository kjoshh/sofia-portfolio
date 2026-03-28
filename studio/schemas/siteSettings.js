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
    defineField({
      name: 'exhibitions',
      title: 'Selected Exhibitions',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Each entry is one exhibition line, e.g. "Circolo Arci Spaziotempo (Solo) - Recanati (IT) - January 2026"',
    }),
    defineField({
      name: 'publications',
      title: 'Selected Publications',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Each entry is one publication line, e.g. "\"L\'arte del tatuaggio\" interview – Lomography Magazine - July 2024"',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'About Page'}
    },
  },
})
