const CustomField = require('../models/CustomField');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');

class CustomFieldsService {
    /**
     * Create a new custom field
     */
    async createCustomField(organizationId, fieldData, createdBy) {
        try {
            // Generate field key from field name
            const fieldKey = fieldData.fieldName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '');

            // Check if field key already exists
            const existing = await CustomField.findOne({
                organizationId,
                fieldKey
            });

            if (existing) {
                throw new Error(`Field with key "${fieldKey}" already exists`);
            }

            // Get next display order
            const maxOrder = await CustomField.findOne({ organizationId })
                .sort({ displayOrder: -1 })
                .select('displayOrder');

            const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;

            // Create custom field
            const customField = await CustomField.create({
                organizationId,
                fieldName: fieldData.fieldName,
                fieldKey,
                fieldType: fieldData.fieldType,
                options: fieldData.options || [],
                required: fieldData.required || false,
                showInListView: fieldData.showInListView || false,
                showInDetailView: fieldData.showInDetailView !== false, // Default true
                defaultValue: fieldData.defaultValue,
                validation: fieldData.validation || {},
                displayOrder
            });

            // Log activity
            await Activity.create({
                organizationId,
                leadId: null, // System-level activity
                type: 'field_updated',
                title: 'Custom field created',
                description: `Created custom field: ${fieldData.fieldName}`,
                performedBy: createdBy,
                performedByType: 'user',
                metadata: {
                    fieldKey,
                    fieldType: fieldData.fieldType
                }
            });

            return customField;
        } catch (error) {
            console.error('Error creating custom field:', error);
            throw error;
        }
    }

    /**
     * Get all custom fields for an organization
     */
    async getCustomFields(organizationId, filters = {}) {
        try {
            const query = { organizationId };

            if (filters.isActive !== undefined) {
                query.isActive = filters.isActive;
            }

            if (filters.showInListView !== undefined) {
                query.showInListView = filters.showInListView;
            }

            const fields = await CustomField.find(query)
                .sort({ displayOrder: 1 })
                .lean();

            return fields;
        } catch (error) {
            console.error('Error getting custom fields:', error);
            throw error;
        }
    }

    /**
     * Get a single custom field
     */
    async getCustomField(organizationId, fieldId) {
        try {
            const field = await CustomField.findOne({
                _id: fieldId,
                organizationId
            });

            if (!field) {
                throw new Error('Custom field not found');
            }

            return field;
        } catch (error) {
            console.error('Error getting custom field:', error);
            throw error;
        }
    }

    /**
     * Update a custom field
     */
    async updateCustomField(organizationId, fieldId, updates, updatedBy) {
        try {
            const field = await CustomField.findOne({
                _id: fieldId,
                organizationId
            });

            if (!field) {
                throw new Error('Custom field not found');
            }

            // Update allowed fields
            const allowedUpdates = [
                'fieldName',
                'options',
                'required',
                'showInListView',
                'showInDetailView',
                'defaultValue',
                'validation',
                'displayOrder',
                'isActive'
            ];

            allowedUpdates.forEach(key => {
                if (updates[key] !== undefined) {
                    field[key] = updates[key];
                }
            });

            field.updatedAt = new Date();
            await field.save();

            // Log activity
            await Activity.create({
                organizationId,
                leadId: null,
                type: 'field_updated',
                title: 'Custom field updated',
                description: `Updated custom field: ${field.fieldName}`,
                performedBy: updatedBy,
                performedByType: 'user',
                metadata: {
                    fieldKey: field.fieldKey,
                    updates: Object.keys(updates)
                }
            });

            return field;
        } catch (error) {
            console.error('Error updating custom field:', error);
            throw error;
        }
    }

    /**
     * Delete a custom field
     */
    async deleteCustomField(organizationId, fieldId, deletedBy) {
        try {
            const field = await CustomField.findOne({
                _id: fieldId,
                organizationId
            });

            if (!field) {
                throw new Error('Custom field not found');
            }

            const fieldKey = field.fieldKey;
            const fieldName = field.fieldName;

            // Delete the field
            await CustomField.deleteOne({ _id: fieldId });

            // Remove field values from all leads
            await Lead.updateMany(
                { organizationId },
                { $unset: { [`customFields.${fieldKey}`]: "" } }
            );

            // Log activity
            await Activity.create({
                organizationId,
                leadId: null,
                type: 'field_updated',
                title: 'Custom field deleted',
                description: `Deleted custom field: ${fieldName}`,
                performedBy: deletedBy,
                performedByType: 'user',
                metadata: {
                    fieldKey,
                    fieldName
                }
            });

            return { success: true, message: 'Custom field deleted successfully' };
        } catch (error) {
            console.error('Error deleting custom field:', error);
            throw error;
        }
    }

    /**
     * Reorder custom fields
     */
    async reorderFields(organizationId, fieldOrders) {
        try {
            // fieldOrders: [{ fieldId, displayOrder }, ...]
            const updates = fieldOrders.map(({ fieldId, displayOrder }) => ({
                updateOne: {
                    filter: { _id: fieldId, organizationId },
                    update: { $set: { displayOrder } }
                }
            }));

            await CustomField.bulkWrite(updates);

            return { success: true, message: 'Fields reordered successfully' };
        } catch (error) {
            console.error('Error reordering fields:', error);
            throw error;
        }
    }

    /**
     * Validate custom field value
     */
    validateFieldValue(field, value) {
        // Required check
        if (field.required && (value === null || value === undefined || value === '')) {
            return { valid: false, error: `${field.fieldName} is required` };
        }

        // Skip validation if value is empty and not required
        if (!value && !field.required) {
            return { valid: true };
        }

        // Type-specific validation
        switch (field.fieldType) {
            case 'number':
                if (isNaN(value)) {
                    return { valid: false, error: `${field.fieldName} must be a number` };
                }
                if (field.validation?.min !== undefined && value < field.validation.min) {
                    return { valid: false, error: `${field.fieldName} must be at least ${field.validation.min}` };
                }
                if (field.validation?.max !== undefined && value > field.validation.max) {
                    return { valid: false, error: `${field.fieldName} must be at most ${field.validation.max}` };
                }
                break;

            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    return { valid: false, error: `${field.fieldName} must be a valid email` };
                }
                break;

            case 'url':
                try {
                    new URL(value);
                } catch {
                    return { valid: false, error: `${field.fieldName} must be a valid URL` };
                }
                break;

            case 'date':
                if (isNaN(Date.parse(value))) {
                    return { valid: false, error: `${field.fieldName} must be a valid date` };
                }
                break;

            case 'dropdown':
                if (field.options && !field.options.includes(value)) {
                    return { valid: false, error: `${field.fieldName} must be one of: ${field.options.join(', ')}` };
                }
                break;

            case 'boolean':
                if (typeof value !== 'boolean') {
                    return { valid: false, error: `${field.fieldName} must be true or false` };
                }
                break;

            case 'text':
            case 'textarea':
                if (field.validation?.pattern) {
                    const regex = new RegExp(field.validation.pattern);
                    if (!regex.test(value)) {
                        return {
                            valid: false,
                            error: field.validation.message || `${field.fieldName} format is invalid`
                        };
                    }
                }
                break;
        }

        return { valid: true };
    }

    /**
     * Set custom field value on a lead
     */
    async setLeadFieldValue(leadId, fieldKey, value, organizationId) {
        try {
            // Get field definition
            const field = await CustomField.findOne({
                organizationId,
                fieldKey,
                isActive: true
            });

            if (!field) {
                throw new Error(`Custom field "${fieldKey}" not found`);
            }

            // Validate value
            const validation = this.validateFieldValue(field, value);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            // Update lead
            const lead = await Lead.findOne({ _id: leadId, organizationId });
            if (!lead) {
                throw new Error('Lead not found');
            }

            if (!lead.customFields) {
                lead.customFields = new Map();
            }

            lead.customFields.set(fieldKey, value);
            await lead.save();

            return lead;
        } catch (error) {
            console.error('Error setting lead field value:', error);
            throw error;
        }
    }

    /**
     * Get custom field values for a lead
     */
    async getLeadFieldValues(leadId, organizationId) {
        try {
            const lead = await Lead.findOne({ _id: leadId, organizationId })
                .select('customFields')
                .lean();

            if (!lead) {
                throw new Error('Lead not found');
            }

            return lead.customFields || {};
        } catch (error) {
            console.error('Error getting lead field values:', error);
            throw error;
        }
    }
}

module.exports = new CustomFieldsService();
