const cron = require('node-cron');
const { Tenant } = require('../models');
const DataSyncServiceBulk = require('../services/dataSyncServiceBulk');

// Choose which sync service to use based on environment variable
const USE_BULK_SYNC = process.env.USE_BULK_SYNC === 'true' || process.env.NODE_ENV === 'production';

class SchedulerService {
  constructor() {
    // Use bulk sync in production/when flag set, otherwise also default to bulk (legacy removed)
    this.dataSyncService = new DataSyncServiceBulk();
    this.jobs = new Map();
  }

  startScheduler() {
    console.log('Starting data sync scheduler...');
    
    // Run every 6 hours (0 */6 * * *)
    // For demo purposes, you can change this to run more frequently
    const syncInterval = process.env.SYNC_INTERVAL_HOURS || 6;
    const cronPattern = `0 */${syncInterval} * * *`;
    
    const job = cron.schedule(cronPattern, async () => {
      console.log('Running scheduled data sync for all tenants...');
      await this.syncAllTenants();
    }, {
      scheduled: false
    });

    this.jobs.set('main-sync', job);
    job.start();
    
    console.log(`Scheduled data sync to run every ${syncInterval} hours`);
  }

  async syncAllTenants() {
    try {
      const activeTenants = await Tenant.findAll({
        where: { 
          isActive: true 
        },
        attributes: ['id', 'email', 'shopifyStoreName']
      });

      console.log(`Found ${activeTenants.length} active tenants to sync`);

      for (const tenant of activeTenants) {
        try {
          console.log(`Starting sync for tenant: ${tenant.email}`);
          await this.dataSyncService.syncTenantData(tenant.id);
          console.log(`Completed sync for tenant: ${tenant.email}`);
        } catch (error) {
          console.error(`Failed to sync tenant ${tenant.email}:`, error.message);
          // Continue with other tenants even if one fails
        }
      }

      console.log('Completed scheduled sync for all tenants');
    } catch (error) {
      console.error('Error in scheduled sync:', error);
    }
  }

  async syncSingleTenant(tenantId) {
    try {
      await this.dataSyncService.syncTenantData(tenantId);
      console.log(`Manual sync completed for tenant: ${tenantId}`);
    } catch (error) {
      console.error(`Manual sync failed for tenant: ${tenantId}`, error);
      throw error;
    }
  }

  stopScheduler() {
    console.log('Stopping data sync scheduler...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped job: ${name}`);
    });
    this.jobs.clear();
  }

  getJobStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running,
        lastDate: job.lastDate(),
        nextDate: job.nextDate()
      };
    });
    return status;
  }
}

module.exports = SchedulerService;
