Item
  has_many item_audits
  has_many locations through item_audits

  require_image (boolean)
  require_image_confirmation (boolean)

  identifier
  identifier_type (serial, part no, etc.)

  item_type (item / collection), e.g. "drill" vs "chairs"
  collection_amount (int, default 1), e.g. 10 chairs

  metadata (serial number, etc.)

ItemAudit
  belongs_to item
  belongs_to location
  belongs_to auditer
  has_many chats

  image_url
  image_confirmed (boolean)

  coordinates (lat, long)

  metadata (serial number, etc.)
  comments (free)

Audit
  belongs_to organization
  belongs_to auditer
  has_many item_audits
  has_many items through item_audits

Chat
  belongs_to audit
  sender (nil for user and userId for user)

  chat_text
  imageUrl

Location
  has_many audits
  has_many items through audits

  name
  coordinates (lat, long)

OrganizationRole
  userId
  organizationId

  role (:member // :admin)

Organization
  has_many locations

  name
