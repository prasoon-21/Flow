const moduleEnum = ['dashboard', 'ivr', 'email', 'whatsapp', 'chatbot', 'automations'];
const roleEnum = ['admin', 'agent', 'viewer'];

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Aurika Flow API',
    version: '1.0.0',
    description:
      'OpenAPI specification for the Next.js API routes. tRPC endpoints are documented at a high level.',
  },
  servers: [{ url: 'http://localhost:3000' }],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'User', description: 'Authenticated user profile endpoints' },
    { name: 'Admin', description: 'Admin-only provisioning endpoints' },
    { name: 'Integrations', description: 'OAuth flows for external integrations' },
    { name: 'Webhooks', description: 'Inbound webhook endpoints' },
    { name: 'tRPC', description: 'tRPC gateway' },
    { name: 'Docs', description: 'OpenAPI discovery' },
  ],
  paths: {
    '/api/openapi': {
      get: {
        tags: ['Docs'],
        summary: 'Fetch the OpenAPI spec',
        responses: {
          '200': {
            description: 'OpenAPI JSON document',
            content: {
              'application/json': {
                schema: { type: 'object', additionalProperties: true },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in with user ID and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
              example: { userId: 'drmorepen_admin', password: '@dmin@2025' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          '400': {
            description: 'Invalid payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out and clear session cookie',
        responses: {
          '200': {
            description: 'Logout successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OkResponse' },
              },
            },
          },
        },
      },
    },
    '/api/user/profile': {
      post: {
        tags: ['User'],
        summary: 'Update the current user profile',
        security: [{ SessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Profile updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateProfileResponse' },
              },
            },
          },
          '400': {
            description: 'Invalid payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '409': {
            description: 'Email already in use',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/admin/users': {
      post: {
        tags: ['Admin'],
        summary: 'Create or update a user',
        security: [{ AdminKey: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AdminUserRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'User updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminUserResponse' },
              },
            },
          },
          '201': {
            description: 'User created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminUserResponse' },
              },
            },
          },
          '400': {
            description: 'Invalid payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/admin/pages': {
      post: {
        tags: ['Admin'],
        summary: 'Create or update a page record',
        security: [{ AdminKey: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AdminPageRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Page updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminPageResponse' },
              },
            },
          },
          '201': {
            description: 'Page created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminPageResponse' },
              },
            },
          },
          '400': {
            description: 'Invalid payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/google/auth-url': {
      get: {
        tags: ['Integrations'],
        summary: 'Generate Google OAuth authorization URL',
        responses: {
          '200': {
            description: 'Authorization URL',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthUrlResponse' },
              },
            },
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/google/exchange': {
      post: {
        tags: ['Integrations'],
        summary: 'Exchange Google OAuth authorization code for tokens',
        description: 'Requires the OAuth state cookie set by the auth-url endpoint.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ExchangeRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Exchange successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GoogleExchangeResponse' },
              },
            },
          },
          '400': {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/zoho/auth-url': {
      get: {
        tags: ['Integrations'],
        summary: 'Generate Zoho OAuth authorization URL',
        responses: {
          '200': {
            description: 'Authorization URL',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthUrlResponse' },
              },
            },
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/zoho/exchange': {
      post: {
        tags: ['Integrations'],
        summary: 'Exchange Zoho OAuth authorization code for tokens',
        description: 'Requires the OAuth state cookie set by the auth-url endpoint.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ExchangeRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Exchange successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ZohoExchangeResponse' },
              },
            },
          },
          '400': {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/webhooks/whatsapp': {
      post: {
        tags: ['Webhooks'],
        summary: 'Ingest WhatsApp webhook payloads',
        security: [{ WebhookSecret: [], TenantHeader: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
        responses: {
          '200': {
            description: 'Ingest successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WebhookIngestResponse' },
              },
            },
          },
          '400': {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/trpc/{path}': {
      get: {
        tags: ['tRPC'],
        summary: 'tRPC procedure call (query)',
        parameters: [
          {
            name: 'path',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'tRPC response payload',
            content: {
              'application/json': {
                schema: { type: 'object', additionalProperties: true },
              },
            },
          },
        },
      },
      post: {
        tags: ['tRPC'],
        summary: 'tRPC procedure call (mutation)',
        parameters: [
          {
            name: 'path',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
        responses: {
          '200': {
            description: 'tRPC response payload',
            content: {
              'application/json': {
                schema: { type: 'object', additionalProperties: true },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      AdminKey: {
        type: 'apiKey',
        in: 'header',
        name: 'x-admin-key',
      },
      WebhookSecret: {
        type: 'apiKey',
        in: 'header',
        name: 'x-aurika-shared-secret',
      },
      TenantHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'x-aurika-tenant-id',
      },
      SessionCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'aurika_session',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          details: { type: 'object', additionalProperties: true },
        },
        required: ['error'],
      },
      OkResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
        },
        required: ['ok'],
      },
      AuthUrlResponse: {
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri' },
        },
        required: ['url'],
      },
      LoginRequest: {
        type: 'object',
        properties: {
          userId: { type: 'string', minLength: 1 },
          password: { type: 'string', minLength: 1 },
        },
        required: ['userId', 'password'],
      },
      UserSummary: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          role: { type: 'string', enum: roleEnum },
          modules: { type: 'array', items: { type: 'string', enum: moduleEnum } },
          capabilities: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'name', 'role', 'modules', 'capabilities'],
      },
      LoginResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          user: { $ref: '#/components/schemas/UserSummary' },
        },
        required: ['ok', 'user'],
      },
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          currentPassword: { type: 'string', minLength: 1 },
        },
      },
      UserProfileSummary: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: roleEnum },
          tenantId: { type: 'string' },
        },
        required: ['id', 'name', 'email', 'role', 'tenantId'],
      },
      UpdateProfileResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          user: { $ref: '#/components/schemas/UserProfileSummary' },
        },
        required: ['ok', 'user'],
      },
      AdminUserRequest: {
        type: 'object',
        properties: {
          userId: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 1 },
          tenantId: { type: 'string', minLength: 1 },
          modules: {
            type: 'array',
            items: { type: 'string', enum: moduleEnum },
            minItems: 1,
          },
          password: { type: 'string', minLength: 6 },
          capabilities: { type: 'array', items: { type: 'string' } },
          metadata: { type: 'object', additionalProperties: true },
          role: { type: 'string', enum: roleEnum },
        },
        required: ['userId', 'email', 'name', 'tenantId', 'modules'],
      },
      AdminUserResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          created: { type: 'boolean' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
              tenantId: { type: 'string' },
              role: { type: 'string', enum: roleEnum },
              modules: { type: 'array', items: { type: 'string', enum: moduleEnum } },
              capabilities: { type: 'array', items: { type: 'string' } },
              metadata: { type: 'object', additionalProperties: true, nullable: true },
            },
            required: ['id', 'email', 'name', 'tenantId', 'role', 'modules', 'capabilities'],
          },
        },
        required: ['ok', 'created', 'user'],
      },
      AdminPageRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          path: { type: 'string', minLength: 1 },
          projectKey: { type: 'string', minLength: 1 },
          tenantId: { type: 'string', nullable: true },
          moduleKey: { type: 'string', enum: moduleEnum },
          requiredModules: {
            type: 'array',
            items: { type: 'string', enum: moduleEnum },
          },
          requiredCapabilities: { type: 'array', items: { type: 'string' } },
        },
        required: ['name', 'path'],
      },
      AdminPageResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          created: { type: 'boolean' },
          page: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              path: { type: 'string' },
              projectKey: { type: 'string' },
              tenantId: { type: 'string', nullable: true },
              moduleKey: { type: 'string', enum: moduleEnum, nullable: true },
              requiredModules: {
                type: 'array',
                items: { type: 'string', enum: moduleEnum },
                nullable: true,
              },
              requiredCapabilities: {
                type: 'array',
                items: { type: 'string' },
                nullable: true,
              },
            },
            required: ['id', 'name', 'path', 'projectKey', 'tenantId'],
          },
        },
        required: ['ok', 'created', 'page'],
      },
      ExchangeRequest: {
        type: 'object',
        properties: {
          code: { type: 'string', minLength: 1 },
          state: { type: 'string', minLength: 1 },
        },
        required: ['code', 'state'],
      },
      GoogleExchangeResponse: {
        type: 'object',
        properties: {
          tokens: { type: 'object', additionalProperties: true },
          profile: { type: 'object', additionalProperties: true },
        },
        required: ['tokens', 'profile'],
      },
      ZohoTokens: {
        type: 'object',
        properties: {
          access_token: { type: 'string' },
          refresh_token: { type: 'string', nullable: true },
          expires_in: { type: 'number', nullable: true },
          api_domain: { type: 'string', nullable: true },
        },
        required: ['access_token', 'refresh_token', 'expires_in', 'api_domain'],
      },
      ZohoProfile: {
        type: 'object',
        properties: {
          email: { type: 'string', nullable: true },
          name: { type: 'string', nullable: true },
          accountId: { type: 'string', nullable: true },
        },
        required: ['email', 'name', 'accountId'],
      },
      ZohoAccount: {
        type: 'object',
        properties: {
          accountId: { type: 'string', nullable: true },
          name: { type: 'string', nullable: true },
          mailboxAddress: { type: 'string', nullable: true },
          primaryEmail: { type: 'string', nullable: true },
          emails: { type: 'array', items: { type: 'string' } },
        },
        required: ['accountId', 'name', 'mailboxAddress', 'primaryEmail', 'emails'],
      },
      ZohoExchangeResponse: {
        type: 'object',
        properties: {
          tokens: { $ref: '#/components/schemas/ZohoTokens' },
          profile: { $ref: '#/components/schemas/ZohoProfile' },
          accounts: {
            type: 'array',
            items: { $ref: '#/components/schemas/ZohoAccount' },
          },
        },
        required: ['tokens', 'profile', 'accounts'],
      },
      WebhookIngestResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ok'] },
        },
        required: ['status'],
      },
    },
  },
} as const;

export function getOpenApiSpec(baseUrl?: string) {
  if (baseUrl) {
    return {
      ...openApiSpec,
      servers: [{ url: baseUrl }],
    };
  }
  return openApiSpec;
}
