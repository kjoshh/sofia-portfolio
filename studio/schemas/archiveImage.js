import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'archiveImage',
  title: 'Archive Image',
  type: 'document',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      description: 'The photo to display in the archive grid.',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isBw',
      title: 'Black & White',
      type: 'boolean',
      description: 'Turn on if this is a black & white photo. This is used for the color/BW filter in the archive.',
      initialValue: false,
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      description: 'Controls the position in the archive grid. Lower numbers appear first.',
      initialValue: 0,
    }),
  ],
  orderings: [
    {title: 'Sort Order', name: 'sortOrder', by: [{field: 'sortOrder', direction: 'asc'}]},
  ],
  preview: {
    select: {media: 'image', sortOrder: 'sortOrder', isBw: 'isBw'},
    prepare({media, sortOrder, isBw}) {
      return {
        title: `Archive #${sortOrder || '?'}${isBw ? ' (B&W)' : ''}`,
        media,
      }
    },
  },
})
