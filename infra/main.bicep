// Provisions the Azure API, static frontend, storage, and monitoring resources.
targetScope = 'resourceGroup'

@description('Azure region for the application resources.')
param location string = resourceGroup().location

@description('Short environment name used in resource naming.')
param environmentName string = 'prod'

@secure()
@description('Supabase PostgreSQL connection string.')
param databaseUrl string

@secure()
@description('JWT signing secret, at least 32 characters.')
param jwtSecret string

@description('Supabase project URL.')
param supabaseUrl string

@secure()
@description('Supabase service-role key used only by the API for photo storage.')
param supabaseServiceRoleKey string

@description('Supabase Storage bucket name.')
param supabaseStorageBucket string = 'listing-photos'

@description('Allowed browser origin. Use the Static Web App URL after provisioning.')
param clientOrigin string

@description('SMTP server used to send account confirmation email.')
param smtpHost string

@description('Verified sender address for Nairent confirmation email.')
param smtpFrom string

@description('SMTP server port. Use 587 for STARTTLS or 465 for implicit TLS.')
param smtpPort int = 587

@description('Use implicit TLS, normally true only for SMTP port 465.')
param smtpSecure bool = false

@secure()
@description('SMTP username for the email provider.')
param smtpUser string

@secure()
@description('SMTP password for the email provider.')
param smtpPassword string

var resourceToken = uniqueString(subscription().id, resourceGroup().id, location, environmentName)
var planName = 'azasp${resourceToken}'
var appName = 'azapp${resourceToken}'
var identityName = 'azid${resourceToken}'
var insightsName = 'azai${resourceToken}'
var workspaceName = 'azlaw${resourceToken}'
var staticSiteName = 'azswa${resourceToken}'

resource workspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: workspaceName
  location: location
  properties: {
    retentionInDays: 30
    sku: {
      name: 'PerGB2018'
    }
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: insightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: workspace.id
  }
}

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: identityName
  location: location
}

resource plan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: planName
  location: location
  kind: 'linux'
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  properties: {
    reserved: true
  }
}

resource app 'Microsoft.Web/sites@2024-04-01' = {
  name: appName
  location: location
  kind: 'app,linux'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
    }
  }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      alwaysOn: true
      linuxFxVersion: 'NODE|22-lts'
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      http20Enabled: true
      healthCheckPath: '/api/health/live'
      cors: {
        allowedOrigins: [
          clientOrigin
        ]
        supportCredentials: false
      }
      appSettings: [
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'PORT'
          value: '8080'
        }
        {
          name: 'DATABASE_URL'
          value: databaseUrl
        }
        {
          name: 'JWT_SECRET'
          value: jwtSecret
        }
        {
          name: 'CLIENT_ORIGIN'
          value: clientOrigin
        }
        {
          name: 'EMAIL_VERIFICATION_ORIGIN'
          value: clientOrigin
        }
        {
          name: 'SMTP_HOST'
          value: smtpHost
        }
        {
          name: 'SMTP_PORT'
          value: string(smtpPort)
        }
        {
          name: 'SMTP_SECURE'
          value: string(smtpSecure)
        }
        {
          name: 'SMTP_FROM'
          value: smtpFrom
        }
        {
          name: 'SMTP_USER'
          value: smtpUser
        }
        {
          name: 'SMTP_PASSWORD'
          value: smtpPassword
        }
        {
          name: 'SUPABASE_URL'
          value: supabaseUrl
        }
        {
          name: 'SUPABASE_SERVICE_ROLE_KEY'
          value: supabaseServiceRoleKey
        }
        {
          name: 'SUPABASE_STORAGE_BUCKET'
          value: supabaseStorageBucket
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
      ]
    }
  }
}

resource diagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'azdiag${resourceToken}'
  scope: app
  properties: {
    workspaceId: workspace.id
    logs: [
      {
        category: 'AppServiceHTTPLogs'
        enabled: true
      }
      {
        category: 'AppServiceConsoleLogs'
        enabled: true
      }
      {
        category: 'AppServiceAppLogs'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

resource staticSite 'Microsoft.Web/staticSites@2022-09-01' = {
  name: staticSiteName
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    buildProperties: {
      appLocation: '/client'
      outputLocation: 'dist'
      appBuildCommand: 'npm run build'
    }
  }
}

resource staticSiteAppSettings 'Microsoft.Web/staticSites/config@2022-09-01' = {
  name: '${staticSite.name}/appsettings'
  properties: {
    VITE_API_URL: 'https://${app.properties.defaultHostName}/api'
  }
}

output apiUrl string = 'https://${app.properties.defaultHostName}'
output frontendUrl string = 'https://${staticSite.properties.defaultHostname}'
output appName string = app.name
output staticSiteName string = staticSite.name
