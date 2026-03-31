import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The name of your project, e.g. "Hard-Coded" or "Forgetting Dreams".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The URL of the project page. Click "Generate" to create it from the title. Example: "hard-coded" becomes sofiacartuccia.com/hard-coded.html',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      description: 'The preview image shown in the navigation menu. Use a vertical/portrait photo that represents the project.',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Describe the image for accessibility and SEO.',
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery Images',
      type: 'array',
      description: 'All photos in this project. Drag to reorder. The first image appears first in the sequence view.',
      of: [{
        type: 'image',
        options: {hotspot: true},
        fields: [
          defineField({
            name: 'alt',
            title: 'Alt Text',
            type: 'string',
            description: 'Describe the image for accessibility and SEO.',
          }),
        ],
      }],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'infoText',
      title: 'Info Text',
      type: 'text',
      description: 'The project description shown in the "Info" view. Use empty lines between paragraphs.',
      rows: 8,
    }),
    defineField({
      name: 'infoTabLabel',
      title: 'Info Tab Label',
      type: 'string',
      description: 'The label for the third tab (defaults to "Info"). Change this if you want to call it something else.',
      initialValue: 'Info',
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      description: 'Controls the order in the navigation. Lower numbers appear first.',
      initialValue: 0,
    }),
  ],
  orderings: [
    {title: 'Sort Order', name: 'sortOrder', by: [{field: 'sortOrder', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'title', media: 'thumbnail'},
  },
})
