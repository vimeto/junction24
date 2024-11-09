
const auditTool = {
  type: "function" as const,
  function: {
    name: "audit_item_location",
    description: "Generates a report stating that the item has been audited to the provided location.",
    parameters: {
      type: "object",
      required: ["auditor_id", "item_id", "audit_id"],
      properties: {
        auditer_id: {
          type: "integer",
          description: "Unique identifier for the auditor"
        },
        item_id: {
          type: "integer",
          description: "Unique identifier for the item being audited"
        },
        location_id: {
          type: "integer",
          description: "Unique identifier for the location"
        },
        audit_id: {
          type: "integer",
          description: "Unique identifier for the audit. This is the audit ID!"
        },
        metadata: {
          type: "object",
          description: "Additional audit information",
          properties: {
            latitude: {
              type: "number",
              description: "Latitude coordinate of the location"
            },
            longitude: {
              type: "number",
              description: "Longitude coordinate of the location"
            },
            comments: {
              type: "string",
              description: "Optional comments about the audit"
            },
            condition: {
              type: "string",
              enum: ["good", "fair", "poor"],
              description: "Optional assessment of the item's condition"
            },
            image_url: {
              type: "string",
              description: "URL of the audit image if provided"
            },
            image_confirmed: {
              type: "boolean",
              description: "Whether the image has been confirmed"
            },
            serial_number: {
              type: "string",
              description: "Serial number of the item if applicable"
            }
          }
        }
      },
      additionalProperties: false
    }
  }
} as const;

export { auditTool };
