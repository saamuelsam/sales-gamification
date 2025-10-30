// Se usar Joi:
sale_type: Joi.string().valid('direct', 'consortium', 'cash', 'card').default('direct'),

// Se usar Zod:
sale_type: z.enum(['direct', 'consortium', 'cash', 'card']).default('direct'),
