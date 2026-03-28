import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'greetingLine1',
      title: 'Greeting Line 1',
      type: 'string',
      description: 'The first line on the About page, e.g. "Hi, I\'m Sofia Cartuccia,"',
    }),
    defineField({
      name: 'greetingLine2',
      title: 'Greeting Line 2',
      type: 'string',
      description: 'The second line on the About page, e.g. " a photographer and mixed-media artist."',
    }),
    defineField({
      name: 'aboutHero',
      title: 'About Hero Image',
      type: 'image',
      description: 'The large background photo on the About page.',
      options: {hotspot: true},
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Site Settings'}
    },
  },
})
