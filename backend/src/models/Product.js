module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
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
    shopifyProductId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    vendor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    productType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true
    },
    totalInventory: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    compareAtPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    sku: {
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
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true
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
    tableName: 'products',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['tenantId', 'shopifyProductId']
      },
      {
        fields: ['tenantId', 'status']
      },
      {
        fields: ['tenantId', 'productType']
      }
    ]
  });

  Product.associate = function(models) {
    Product.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
    Product.hasMany(models.OrderItem, {
      foreignKey: 'productId',
      as: 'orderItems'
    });
  };

  return Product;
};
