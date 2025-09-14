module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
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
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    shopifyOrderId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    subtotalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    totalTax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    totalDiscounts: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: true
    },
    financialStatus: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fulfillmentStatus: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    gateway: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    totalWeight: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    lineItemsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
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
    tableName: 'orders',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['tenantId', 'shopifyOrderId']
      },
      {
        fields: ['tenantId', 'customerId']
      },
      {
        fields: ['tenantId', 'shopifyCreatedAt']
      },
      {
        fields: ['tenantId', 'totalPrice']
      },
      {
        fields: ['tenantId', 'financialStatus']
      }
    ]
  });

  Order.associate = function(models) {
    Order.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
    Order.belongsTo(models.Customer, {
      foreignKey: 'customerId',
      as: 'customer'
    });
    Order.hasMany(models.OrderItem, {
      foreignKey: 'orderId',
      as: 'orderItems'
    });
  };

  return Order;
};
