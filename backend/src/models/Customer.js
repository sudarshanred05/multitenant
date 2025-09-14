module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'id'
      }
    },
    shopifyCustomerId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    totalSpent: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    ordersCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    acceptsMarketing: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    shopifyCreatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    shopifyUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'customers',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['tenantId', 'shopifyCustomerId']
      },
      {
        fields: ['tenantId', 'email']
      },
      {
        fields: ['tenantId', 'totalSpent']
      }
    ]
  });

  Customer.associate = function(models) {
    Customer.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
    Customer.hasMany(models.Order, {
      foreignKey: 'customerId',
      as: 'orders'
    });
  };

  return Customer;
};
