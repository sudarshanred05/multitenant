const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define('Tenant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100]
      }
    },
    shopifyStoreName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    shopifyAccessToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    shopifyStoreUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastSyncAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'tenants',
    timestamps: true,
    hooks: {
      beforeCreate: async (tenant) => {
        if (tenant.password) {
          tenant.password = await bcrypt.hash(tenant.password, 12);
        }
      },
      beforeUpdate: async (tenant) => {
        if (tenant.changed('password')) {
          tenant.password = await bcrypt.hash(tenant.password, 12);
        }
      }
    }
  });

  Tenant.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

  Tenant.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.shopifyAccessToken;
    return values;
  };

  Tenant.associate = function(models) {
    Tenant.hasMany(models.Customer, {
      foreignKey: 'tenantId',
      as: 'customers'
    });
    Tenant.hasMany(models.Product, {
      foreignKey: 'tenantId',
      as: 'products'
    });
    Tenant.hasMany(models.Order, {
      foreignKey: 'tenantId',
      as: 'orders'
    });
  };

  return Tenant;
};
