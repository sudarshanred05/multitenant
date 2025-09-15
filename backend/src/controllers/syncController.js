const { Tenant } = require('../models');
const DataSyncService = require('../services/dataSyncService');
const DataSyncServiceBulk = require('../services/dataSyncServiceBulk');

// Choose which sync service to use
const USE_BULK_SYNC = process.env.USE_BULK_SYNC === 'true' || process.env.NODE_ENV === 'production';
const dataSyncService = USE_BULK_SYNC ? new DataSyncServiceBulk() : new DataSyncService();

const syncData = async (req, res) => {
  try {
    const { tenantId } = req;

    console.log(`Manual sync initiated for tenant: ${tenantId}`);
    
    // Find the tenant
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    if (!tenant.shopifyAccessToken || !tenant.shopifyStoreUrl) {
      return res.status(400).json({
        success: false,
        message: 'Shopify credentials not configured. Please add your Shopify access token in your profile settings.',
        missingCredentials: {
          accessToken: !tenant.shopifyAccessToken,
          storeUrl: !tenant.shopifyStoreUrl
        }
      });
    }

    // Use the DataSyncService to perform the sync
    const result = await dataSyncService.syncTenantData(tenantId);

    res.status(200).json({
      success: true,
      message: 'Data synchronization completed successfully',
      data: result
    });

  } catch (error) {
    console.error('Error in sync:', error);
    res.status(500).json({
      success: false,
      message: 'Sync failed',
      error: error.message
    });
  }
};

const getSyncStatus = async (req, res) => {
  try {
    const { tenantId } = req;
    
    const tenant = await Tenant.findByPk(tenantId, {
      attributes: ['id', 'lastSyncAt', 'shopifyStoreUrl']
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        tenantId: tenant.id,
        lastSyncAt: tenant.lastSyncAt,
        shopifyStoreUrl: tenant.shopifyStoreUrl,
        hasSynced: !!tenant.lastSyncAt
      }
    });

  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync status',
      error: error.message
    });
  }
};

module.exports = {
  syncData,
  getSyncStatus
};
