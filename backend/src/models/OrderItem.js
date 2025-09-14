module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
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
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    shopifyOrderItemId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    shopifyProductId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    shopifyVariantId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    variantTitle: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    totalDiscount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    vendor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    weight: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    weightUnit: {
      type: DataTypes.STRING,
      allowNull: true
    },
    requiresShipping: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    taxable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
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
    tableName: 'order_items',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['tenantId', 'shopifyOrderItemId']
      },
      {
        fields: ['tenantId', 'orderId']
      },
      {
        fields: ['tenantId', 'productId']
      }
    ]
  });

  OrderItem.associate = function(models) {
    OrderItem.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
    OrderItem.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order'
    });
    OrderItem.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
  };

  return OrderItem;
};
