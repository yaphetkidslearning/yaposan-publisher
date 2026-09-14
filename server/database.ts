import { randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export type EntityName = "users"|"organizations"|"memberships"|"workspaces"|"spaces"|"spaceMemberships"|"projects"|"assets"|"versions"|"subscriptions"|"auditEvents"|"jobs"|"aiCreditTransactions"|"aiCommunityTransactions"|"aiProviderCredentials"|"spacePosts"|"spaceComments"|"spaceFollows"|"spaceAIAgents"|"spaceConnections"|"spaceComputeProfiles"|"spaceStudios"|"spaceStudioRuns"|"spaceInvites"|"spaceStoreProducts"|"spaceStoreOrders"|"marketplaceEntitlements"|"gpuCreditTransactions"|"creatorEarnings"|"creatorPayouts"|"supportTickets"|"supportTicketMessages"|"helpFeedback"|"adminPrincipals"|"adminSessions"|"adminAuditEvents"|"adminModerationActions"|"platformCostEntries"|"spacePrivacySettings"|"spaceDataGrants"|"userSessions"|"spaceSecuritySettings"|"spacePostReactions"|"spaceCommentReactions"|"spacePostBookmarks"|"spacePostReposts"|"spacePostHashtags"|"socialNotifications"|"socialConversations"|"socialConversationMembers"|"socialMessages"|"socialBlocks"|"socialReports"|"socialMediaAssets"|"socialPostMedia"|"socialStories"|"socialStoryViews"|"socialHighlights"|"socialReels"|"socialCommunities"|"socialCommunityMembers"|"socialCommunityPosts"|"socialCommunityModeration"|"socialPages"|"socialEvents"|"socialEventRsvps"|"socialLiveSessions"|"socialLiveChatMessages"|"socialLiveReactions"|"socialAiProfiles"|"socialAiGenerations"|"socialAiModerationSuggestions"|"creatorMembershipPlans"|"creatorMembershipSubscriptions"|"creatorTips"|"paidContentAccess"|"creatorRevenueEvents"|"creatorAdSettings"|"creatorAdCampaigns"|"creatorAdEvents"|"paymentWebhookEvents"|"paymentSecurityEvents"|"paymentReconciliations"|"moderationAppeals"|"userSafetyProfiles"|"authTokens";
export type RecordBase = { id:string; createdAt:string; updatedAt:string };
export type UserRecord = RecordBase & { email:string; passwordHash:string; emailVerified:boolean; emailVerifiedAt?:string; mfaSecret?:string; identityProvider?:"local"|"oidc"; externalSubject?:string; status:"active"|"disabled" };
export type OrganizationRecord = RecordBase & { name:string; ownerUserId:string; plan:"free"|"creator"|"pro"|"business" };
export type MembershipRecord = RecordBase & { organizationId:string; userId:string; role:"owner"|"admin"|"editor"|"viewer" };
export type WorkspaceRecord = RecordBase & { organizationId:string; name:string; region:string };
export type SpaceVisibility = "private"|"team"|"unlisted"|"public"|"paid";
export type SpaceKind = "personal"|"team"|"business";
export type SpaceRole = "owner"|"admin"|"editor"|"store_manager"|"viewer";
export type SpaceRecord = RecordBase & { organizationId:string; ownerUserId:string; name:string; slug:string; kind:SpaceKind; visibility:SpaceVisibility; status:"active"|"archived" };
export type SpaceMembershipRecord = RecordBase & { spaceId:string; userId:string; role:SpaceRole };
export type PostAudience = "private"|"friends"|"followers"|"specific"|"public"|"team"|"unlisted";
export type SpacePostRecord = RecordBase & { spaceId:string; authorUserId:string; body:string; visibility:PostAudience; audienceUserIds?:string[]; mediaUrl?:string; mediaType?:"image"|"video"|"audio"; quotePostId?:string; aiGenerated?:boolean; aiAgentId?:string; aiDisclosure?:string; accessModel?:"free"|"paid"; priceCents?:number };
export type SpaceCommentRecord = RecordBase & { postId:string; authorUserId:string; body:string; parentCommentId?:string };
export type SpaceFollowRecord = RecordBase & { spaceId:string; followerUserId:string };
export type SocialReactionKind = "like"|"dislike"|"love"|"laugh"|"wow"|"fire";
export type SpacePostReactionRecord = RecordBase & { spaceId:string; postId:string; userId:string; kind:SocialReactionKind };
export type SpaceCommentReactionRecord = RecordBase & { spaceId:string; commentId:string; userId:string; kind:SocialReactionKind };
export type SpacePostBookmarkRecord = RecordBase & { spaceId:string; postId:string; userId:string };
export type SpacePostRepostRecord = RecordBase & { spaceId:string; postId:string; userId:string };
export type SpacePostHashtagRecord = RecordBase & { spaceId:string; postId:string; tag:string };
export type SocialNotificationRecord = RecordBase & { spaceId:string; userId:string; actorUserId:string; kind:"reaction"|"comment"|"mention"|"repost"|"message"; resourceType:string; resourceId:string; readAt?:string };
export type SocialConversationRecord = RecordBase & { spaceId:string; createdByUserId:string; title?:string };
export type SocialConversationMemberRecord = RecordBase & { conversationId:string; userId:string; lastReadAt?:string };
export type SocialMessageRecord = RecordBase & { spaceId:string; conversationId:string; senderUserId:string; body:string };
export type SocialBlockRecord = RecordBase & { spaceId:string; userId:string; targetUserId:string };
export type SocialReportRecord = RecordBase & { spaceId:string; reporterUserId:string; resourceType:"post"|"comment"|"message"|"user"; resourceId:string; reason:string; status:"open"|"reviewing"|"resolved"|"dismissed" };
export type SocialMediaKind = "image"|"video"|"audio";
export type SocialMediaAssetRecord = RecordBase & { spaceId:string; ownerUserId:string; kind:SocialMediaKind; storageKey:string; url?:string; mimeType:string; size:number; caption?:string; altText?:string; thumbnailUrl?:string; width?:number; height?:number; durationMs?:number; processingStatus:"uploaded"|"processing"|"ready"|"failed"; moderationStatus:"pending"|"approved"|"blocked"; };
export type SocialPostMediaRecord = RecordBase & { spaceId:string; postId:string; mediaAssetId:string; position:number };
export type SocialStoryRecord = RecordBase & { spaceId:string; authorUserId:string; mediaAssetId?:string; body?:string; visibility:"private"|"public"|"followers"|"team"; expiresAt:string; highlightId?:string };
export type SocialStoryViewRecord = RecordBase & { storyId:string; userId:string; viewedAt:string };
export type SocialHighlightRecord = RecordBase & { spaceId:string; ownerUserId:string; name:string; coverMediaAssetId?:string };
export type SocialReelRecord = RecordBase & { spaceId:string; postId:string; authorUserId:string; mediaAssetId:string; caption?:string; audioTitle?:string; durationMs?:number; status:"draft"|"published"|"blocked" };


export type SocialCommunityRecord = RecordBase & { spaceId:string; ownerUserId:string; name:string; slug:string; description?:string; visibility:"public"|"private"; joinPolicy:"open"|"approval"|"invite"; membershipPlanId?:string; status:"active"|"archived" };
export type SocialCommunityMemberRecord = RecordBase & { communityId:string; userId:string; role:"owner"|"admin"|"moderator"|"member"; status:"active"|"pending"|"banned" };
export type SocialCommunityPostRecord = RecordBase & { communityId:string; postId:string; authorUserId:string; status:"published"|"hidden"|"removed" };
export type SocialCommunityModerationRecord = RecordBase & { communityId:string; actorUserId:string; targetType:"post"|"member"; targetId:string; action:"hide"|"remove"|"warn"|"mute"|"ban"|"restore"; reason?:string };
export type SocialPageRecord = RecordBase & { spaceId:string; ownerUserId:string; kind:"creator"|"business"|"brand"|"organization"; name:string; slug:string; bio?:string; category?:string; website?:string; verified:boolean; status:"active"|"archived" };
export type SocialEventRecord = RecordBase & { spaceId:string; creatorUserId:string; communityId?:string; pageId?:string; title:string; description?:string; locationType:"online"|"in_person"|"hybrid"; location?:string; startsAt:string; endsAt?:string; visibility:"public"|"community"|"private"; status:"scheduled"|"live"|"ended"|"cancelled" };
export type SocialEventRsvpRecord = RecordBase & { eventId:string; userId:string; response:"going"|"interested"|"not_going" };
export type SocialLiveSessionRecord = RecordBase & { spaceId:string; hostUserId:string; communityId?:string; pageId?:string; eventId?:string; title:string; description?:string; streamKeyHash?:string; playbackUrl?:string; status:"scheduled"|"live"|"ended"|"blocked"; startedAt?:string; endedAt?:string; viewerCount:number };
export type SocialLiveChatMessageRecord = RecordBase & { liveSessionId:string; userId:string; body:string; status:"visible"|"hidden"|"removed" };
export type SocialLiveReactionRecord = RecordBase & { liveSessionId:string; userId:string; kind:"like"|"love"|"laugh"|"wow"|"fire" };


export type SocialAiProfileRecord = RecordBase & { spaceId:string; agentId:string; ownerUserId:string; displayName:string; handle:string; bio?:string; identityType:"ai"; disclosure:string; autonomousPosting:boolean; status:"active"|"paused"|"archived" };
export type SocialAiGenerationRecord = RecordBase & { spaceId:string; userId:string; agentId?:string; kind:"ask"|"caption"|"reply"|"translate"|"summary"|"search"; prompt:string; sourceText?:string; output:string; provider?:string; model?:string; aiGenerated:true; status:"completed"|"failed" };
export type SocialAiModerationSuggestionRecord = RecordBase & { spaceId:string; reviewerUserId:string; resourceType:string; resourceId:string; risk:"low"|"medium"|"high"; indicators:string[]; status:"suggested"|"reviewed"|"dismissed"; humanDecision?:string };
export type CreatorMembershipPlanRecord = RecordBase & { spaceId:string; creatorUserId:string; name:string; description?:string; monthlyCents:number; currency:string; benefits:string[]; status:"active"|"paused"|"archived" };
export type CreatorMembershipSubscriptionRecord = RecordBase & { planId:string; creatorUserId:string; subscriberUserId:string; status:"pending"|"active"|"past_due"|"canceled"; currentPeriodEnd?:string; providerCustomerId?:string; providerSubscriptionId?:string; providerCheckoutSessionId?:string };
export type CreatorTipRecord = RecordBase & { spaceId:string; creatorUserId:string; senderUserId:string; amountCents:number; currency:string; message?:string; status:"pending"|"paid"|"refunded"; providerCheckoutSessionId?:string; providerPaymentIntentId?:string };
export type PaidContentAccessRecord = RecordBase & { postId:string; creatorUserId:string; buyerUserId:string; priceCents:number; currency:string; status:"pending"|"active"|"refunded"; providerCheckoutSessionId?:string; providerPaymentIntentId?:string };
export type CreatorRevenueEventRecord = RecordBase & { creatorUserId:string; sourceType:"membership"|"tip"|"paid_post"|"marketplace"|"ad_click"; sourceId:string; grossCents:number; platformFeeCents:number; creatorNetCents:number; currency:string; status:"pending"|"available"|"paid"|"refunded" };
export type CreatorAdSettingRecord = RecordBase & { spaceId:string; creatorUserId:string; enabled:boolean; cpcCents:number; currency:string; placement:"bottom_overlay"|"bottom_banner"; requireApproval:boolean; platformFeeBps:number; status:"active"|"paused" };
export type CreatorAdCampaignRecord = RecordBase & { spaceId:string; creatorUserId:string; advertiserUserId:string; title:string; description?:string; imageUrl?:string; targetUrl:string; budgetCents:number; fundedCents:number; spentCents:number; cpcCents:number; currency:string; status:"pending_funding"|"awaiting_approval"|"active"|"paused"|"rejected"|"completed"|"refunded"; providerCheckoutSessionId?:string; providerPaymentIntentId?:string };
export type CreatorAdEventRecord = RecordBase & { campaignId:string; spaceId:string; creatorUserId:string; eventType:"impression"|"click"; visitorKey:string; billedCents:number; platformFeeCents:number; creatorNetCents:number; currency:string; fraudStatus:"accepted"|"duplicate"|"blocked" };
export type PaymentWebhookEventRecord = RecordBase & { provider:"stripe"; providerEventId:string; eventType:string; status:"processing"|"processed"|"failed"; processedAt?:string; error?:string };

export type PaymentReconciliationRecord = RecordBase & { creatorUserId:string; provider:"stripe"; providerEventId:string; kind:"refund"|"dispute"|"chargeback"; resourceType:"tip"|"paid_post"|"membership"|"ad_campaign"|"marketplace_order"; resourceId:string; grossCents:number; platformFeeCents:number; creatorNetCents:number; currency:string; status:"applied"|"requires_clawback"|"resolved"; reason?:string };
export type ModerationAppealRecord = RecordBase & { userId:string; resourceType:"post"|"comment"|"message"|"space"|"user"; resourceId:string; reason:string; status:"open"|"reviewing"|"upheld"|"reversed"; reviewedByPrincipalId?:string; decisionNote?:string; resolvedAt?:string };
export type UserSafetyProfileRecord = RecordBase & { userId:string; ageBand:"under_13"|"teen"|"adult"; guardianConsentStatus:"required"|"verified"|"not_required"; personalizedAds:boolean; unknownDm:boolean; liveHost:boolean; creatorMonetization:boolean; sensitiveMediaDefault:"blur"|"show" };

export type PaymentSecurityEventRecord = RecordBase & { userId?:string; kind:"raw_card_rejected"|"checkout_created"|"webhook_duplicate"|"webhook_failed"|"payment_dispute"|"refund"; severity:"info"|"medium"|"high"|"critical"; provider?:"stripe"; resourceType?:string; resourceId?:string; metadata?:Record<string,unknown> };



export type SpaceAIAgentRecord = RecordBase & { spaceId:string; ownerUserId:string; name:string; provider:string; model?:string; instructions?:string; visibility:SpaceVisibility; enabled:boolean };
export type SpaceConnectionRecord = RecordBase & { spaceId:string; ownerUserId:string; name:string; kind:"openai"|"anthropic"|"gemini"|"huggingface"|"custom_api"|"local_ai"; endpoint?:string; credentialRef?:string; billing:"external"|"yaposan"; status:"connected"|"disconnected" };
export type SpaceComputeProfileRecord = RecordBase & { spaceId:string; ownerUserId:string; name:string; kind:"yaposan_gpu"|"local_gpu"|"computer"|"cloud_gpu"; endpoint?:string; provider?:string; billing:"external"|"yaposan"|"none"; status:"online"|"offline" };
export type StudioNodeKind = "input"|"tool"|"ai"|"compute"|"output";
export type StudioNode = { id:string; kind:StudioNodeKind; name:string; refId?:string; config?:Record<string,unknown> };
export type StudioEdge = { from:string; to:string };
export type SpaceStudioRecord = RecordBase & { spaceId:string; ownerUserId:string; name:string; description?:string; visibility:SpaceVisibility; status:"draft"|"published"|"archived"; nodes:StudioNode[]; edges:StudioEdge[]; version:number };
export type StudioRunStatus = "running"|"succeeded"|"failed"|"cancelled";
export type StudioNodeExecutionState = { nodeId:string; status:"pending"|"running"|"succeeded"|"failed"|"skipped"; startedAt?:string; finishedAt?:string; durationMs?:number; error?:string };
export type SpaceStudioRunRecord = RecordBase & { spaceId:string; studioId:string; userId:string; status:StudioRunStatus; input:unknown; output?:unknown; steps:unknown[]; error?:string; traceId?:string; executionKey?:string; studioVersion?:number; nodeStates?:StudioNodeExecutionState[]; approvedNodeIds?:string[]; startedAt?:string; finishedAt?:string; durationMs?:number; parentRunId?:string };
export type SpaceInviteRecord = RecordBase & { spaceId:string; email:string; role:Exclude<SpaceRole,"owner">; invitedByUserId:string; status:"pending"|"accepted"|"revoked" };
export type SpaceStoreProductKind = "ai"|"studio"|"template"|"workflow"|"digital_product"|"service";
export type SpaceStoreProductRecord = RecordBase & { spaceId:string; ownerUserId:string; kind:SpaceStoreProductKind; name:string; description?:string; priceCents:number; currency:string; visibility:"private"|"public"; marketplaceListed?:boolean; status:"draft"|"active"|"archived"; resourceId?:string };
export type SpaceStoreOrderRecord = RecordBase & { spaceId:string; productId:string; buyerUserId:string; sellerUserId:string; quantity:number; grossCents:number; platformFeeCents:number; creatorNetCents:number; currency:string; status:"pending"|"paid"|"refunded"; providerCheckoutSessionId?:string; providerPaymentIntentId?:string };
export type MarketplaceEntitlementRecord = RecordBase & { userId:string; spaceId:string; productId:string; orderId?:string; kind:SpaceStoreProductKind; source:"install"|"purchase"; status:"active"|"revoked" };
export type GPUCreditTransactionRecord = RecordBase & { organizationId:string; credits:number; kind:"purchase"|"usage"|"refund"|"adjustment"; packId?:string; amountCents?:number; currency?:string; providerEventId?:string; providerCheckoutSessionId?:string; metadata?:Record<string,unknown> };
export type CreatorEarningRecord = RecordBase & { orderId:string; spaceId:string; productId:string; sellerUserId:string; grossCents:number; platformFeeCents:number; creatorNetCents:number; currency:string; status:"pending"|"available"|"paid"|"refunded" };
export type CreatorPayoutRecord = RecordBase & { sellerUserId:string; amountCents:number; currency:string; status:"pending"|"paid"|"failed"; provider?:string; providerPayoutId?:string; note?:string };
export type ProjectRecord = RecordBase & { workspaceId:string; spaceId?:string; ownerUserId:string; name:string; revision:number; payload:unknown; deletedAt?:string };
export type AssetRecord = RecordBase & { workspaceId:string; spaceId?:string; ownerUserId:string; name:string; mimeType:string; size:number; storageKey:string; checksum?:string; securityStatus?:"pending"|"clean"|"blocked"; securityReason?:string };
export type VersionRecord = RecordBase & { projectId:string; revision:number; payload:unknown; actorUserId:string };
export type AICreditTransactionRecord = RecordBase & { organizationId:string; credits:number; kind:"purchase"|"usage"|"refund"|"adjustment"; packId?:string; amountCents?:number; currency?:string; providerEventId?:string; providerCheckoutSessionId?:string; metadata?:Record<string,unknown> };
export type AICommunityTransactionRecord = RecordBase & { organizationId?:string; month:string; requestId:string; amountMicros:number; kind:"reserve"|"settle"|"release"; metadata?:Record<string,unknown> };
export type AIProviderCredentialRecord = RecordBase & { organizationId:string; provider:string; endpoint?:string; model?:string; encryptedApiKey:string; keyLast4?:string; keyVersion?:string };
export type SupportTicketStatus = "open"|"in_progress"|"waiting_for_user"|"resolved"|"closed";
export type SupportTicketRecord = RecordBase & { userId?:string; email:string; name:string; category:string; priority:"normal"|"important"|"urgent"; subject:string; message:string; status:SupportTicketStatus; source?:string; page?:string; action?:string; diagnostics?:Record<string,unknown>; attachmentName?:string; attachmentMimeType?:string; attachmentSize?:number; attachmentStorageKey?:string };
export type SupportTicketMessageRecord = RecordBase & { ticketId:string; authorUserId?:string; authorType:"user"|"staff"|"system"; body:string; attachmentName?:string; attachmentMimeType?:string; attachmentSize?:number; attachmentStorageKey?:string };
export type HelpFeedbackRecord = RecordBase & { userId?:string; contentType:"faq"|"guide"; contentId:string; helpful:boolean; page?:string; metadata?:Record<string,unknown> };
export type SubscriptionRecord = RecordBase & { organizationId:string; providerCustomerId?:string; providerSubscriptionId?:string; plan:string; status:string; seats:number };
export type AuditEventRecord = RecordBase & { organizationId?:string; actorUserId?:string; action:string; target?:string; requestId?:string; metadata?:Record<string,unknown> };
export type JobRecord = RecordBase & { kind:"export"|"ai"|"image"|"video"|"notification"; status:"queued"|"running"|"succeeded"|"failed"|"cancelled"; progress:number; attempts:number; payload:unknown; result?:unknown; error?:string; workerId?:string; leaseExpiresAt?:string; heartbeatAt?:string };
export type AdminRole = "super_admin"|"support_admin"|"marketplace_admin"|"operations_admin"|"finance_admin"|"security_admin";
export type AdminPrincipalRecord = RecordBase & { email:string; passwordHash:string; role:AdminRole; status:"active"|"disabled"; lastLoginAt?:string };
export type AdminSessionRecord = RecordBase & { principalId:string; expiresAt:string; revokedAt?:string; ipHash?:string; userAgentHash?:string };
export type AuthTokenRecord = RecordBase & { subjectType:"user"|"admin"; subjectId:string; email:string; purpose:"email_verification"|"password_reset"|"admin_password_reset"; tokenHash:string; expiresAt:string; usedAt?:string };
export type AdminAuditEventRecord = RecordBase & { principalId?:string; action:string; target?:string; requestId?:string; metadata?:Record<string,unknown> };
export type AdminModerationActionRecord = RecordBase & { principalId:string; resourceType:"marketplace_product"|"space"|"user"; resourceId:string; action:string; reason?:string; metadata?:Record<string,unknown> };
export type PlatformCostEntryRecord = RecordBase & { principalId:string; category:"ai"|"gpu"|"storage"|"infrastructure"|"payments"|"support"|"other"; amountCents:number; currency:string; period?:string; note?:string; source?:string };
export type ProfileFieldAudience = "private"|"followers"|"public";
export type SpacePrivacySettingsRecord = RecordBase & { spaceId:string; publicPageEnabled:boolean; discoverable:boolean; showFollowerCount:boolean; profileAudience?:ProfileFieldAudience; dmAudience?:"everyone"|"followers"|"nobody"; defaultPostVisibility:"private"|"friends"|"followers"|"specific"|"public"|"team"; externalSharingEnabled:boolean; displayName?:string; bio?:string; website?:string; location?:string; avatarUri?:string; coverUri?:string; displayNameAudience?:ProfileFieldAudience; emailAudience?:ProfileFieldAudience; bioAudience?:ProfileFieldAudience; websiteAudience?:ProfileFieldAudience; locationAudience?:ProfileFieldAudience; avatarAudience?:ProfileFieldAudience; coverAudience?:ProfileFieldAudience; coverX?:number; coverY?:number; coverZoom?:number };
export type SpaceDataGrantRecord = RecordBase & { spaceId:string; connectionId:string; grantedByUserId:string; scopes:string[]; resourceIds:string[]; purpose?:string; status:"active"|"revoked" };
export type UserSessionRecord = RecordBase & { userId:string; version:number; authMethod:string; assurance:"password"|"mfa"|"passkey"|"oidc"; expiresAt:string; lastSeenAt:string; revokedAt?:string; ipHash?:string; userAgentHash?:string; externalSessionKey?:string };
export type SpaceSecuritySettingsRecord = RecordBase & { spaceId:string; requireStepUpForPublicSharing:boolean; requireStepUpForTeamAdmin:boolean; allowPublicComments:boolean; allowExternalConnections:boolean; allowFileDownloads:boolean; invitePolicy:"owner_only"|"admins_only"; uploadPolicy:"strict"|"standard"; securityAlerts:boolean };

export type DatabaseSchema = {
 users:UserRecord; organizations:OrganizationRecord; memberships:MembershipRecord; workspaces:WorkspaceRecord; spaces:SpaceRecord; spaceMemberships:SpaceMembershipRecord; spacePosts:SpacePostRecord; spaceComments:SpaceCommentRecord; spaceFollows:SpaceFollowRecord; spaceAIAgents:SpaceAIAgentRecord; spaceConnections:SpaceConnectionRecord; spaceComputeProfiles:SpaceComputeProfileRecord; spaceStudios:SpaceStudioRecord; spaceStudioRuns:SpaceStudioRunRecord; spaceInvites:SpaceInviteRecord; spaceStoreProducts:SpaceStoreProductRecord; spaceStoreOrders:SpaceStoreOrderRecord; marketplaceEntitlements:MarketplaceEntitlementRecord; gpuCreditTransactions:GPUCreditTransactionRecord; creatorEarnings:CreatorEarningRecord; creatorPayouts:CreatorPayoutRecord; projects:ProjectRecord; assets:AssetRecord; versions:VersionRecord; subscriptions:SubscriptionRecord; auditEvents:AuditEventRecord; jobs:JobRecord; aiCreditTransactions:AICreditTransactionRecord; aiCommunityTransactions:AICommunityTransactionRecord; aiProviderCredentials:AIProviderCredentialRecord; supportTickets:SupportTicketRecord; supportTicketMessages:SupportTicketMessageRecord; helpFeedback:HelpFeedbackRecord; adminPrincipals:AdminPrincipalRecord; adminSessions:AdminSessionRecord; adminAuditEvents:AdminAuditEventRecord; adminModerationActions:AdminModerationActionRecord; platformCostEntries:PlatformCostEntryRecord; spacePrivacySettings:SpacePrivacySettingsRecord; spaceDataGrants:SpaceDataGrantRecord; userSessions:UserSessionRecord; spaceSecuritySettings:SpaceSecuritySettingsRecord; spacePostReactions:SpacePostReactionRecord; spaceCommentReactions:SpaceCommentReactionRecord; spacePostBookmarks:SpacePostBookmarkRecord; spacePostReposts:SpacePostRepostRecord; spacePostHashtags:SpacePostHashtagRecord; socialNotifications:SocialNotificationRecord; socialConversations:SocialConversationRecord; socialConversationMembers:SocialConversationMemberRecord; socialMessages:SocialMessageRecord; socialBlocks:SocialBlockRecord; socialReports:SocialReportRecord; socialMediaAssets:SocialMediaAssetRecord; socialPostMedia:SocialPostMediaRecord; socialStories:SocialStoryRecord; socialStoryViews:SocialStoryViewRecord; socialHighlights:SocialHighlightRecord; socialReels:SocialReelRecord; socialCommunities:SocialCommunityRecord; socialCommunityMembers:SocialCommunityMemberRecord; socialCommunityPosts:SocialCommunityPostRecord; socialCommunityModeration:SocialCommunityModerationRecord; socialPages:SocialPageRecord; socialEvents:SocialEventRecord; socialEventRsvps:SocialEventRsvpRecord; socialLiveSessions:SocialLiveSessionRecord; socialLiveChatMessages:SocialLiveChatMessageRecord; socialLiveReactions:SocialLiveReactionRecord; socialAiProfiles:SocialAiProfileRecord; socialAiGenerations:SocialAiGenerationRecord; socialAiModerationSuggestions:SocialAiModerationSuggestionRecord; creatorMembershipPlans:CreatorMembershipPlanRecord; creatorMembershipSubscriptions:CreatorMembershipSubscriptionRecord; creatorTips:CreatorTipRecord; paidContentAccess:PaidContentAccessRecord; creatorRevenueEvents:CreatorRevenueEventRecord; creatorAdSettings:CreatorAdSettingRecord; creatorAdCampaigns:CreatorAdCampaignRecord; creatorAdEvents:CreatorAdEventRecord; paymentWebhookEvents:PaymentWebhookEventRecord; paymentSecurityEvents:PaymentSecurityEventRecord; paymentReconciliations:PaymentReconciliationRecord; moderationAppeals:ModerationAppealRecord; userSafetyProfiles:UserSafetyProfileRecord; authTokens:AuthTokenRecord;
};

export interface DatabaseAdapter {
 connect():Promise<void>; close():Promise<void>; migrate():Promise<number>;
 insert<K extends EntityName>(table:K, value:Omit<DatabaseSchema[K], keyof RecordBase> & Partial<RecordBase>):Promise<DatabaseSchema[K]>;
 get<K extends EntityName>(table:K,id:string):Promise<DatabaseSchema[K]|undefined>;
 find<K extends EntityName>(table:K,predicate:(row:DatabaseSchema[K])=>boolean):Promise<DatabaseSchema[K][]>;
 update<K extends EntityName>(table:K,id:string,patch:Partial<DatabaseSchema[K]>):Promise<DatabaseSchema[K]>;
 delete<K extends EntityName>(table:K,id:string):Promise<boolean>;
 transaction<T>(fn:(db:DatabaseAdapter)=>Promise<T>):Promise<T>;
 lock?(key:string):Promise<void>;
 claimNextJob?(kind:JobRecord["kind"],workerId:string,leaseSeconds:number):Promise<JobRecord|undefined>;
 recoverStaleJobs?(kind:JobRecord["kind"],now?:Date):Promise<number>;
}

export class InMemoryDatabase implements DatabaseAdapter {
 private connected=false;
 private transactionTail:Promise<void>=Promise.resolve();
 private transactionDepth=0;
 private readonly lockTimeoutMs=Math.max(1000,Number(process.env.YAPOSAN_LOCAL_DB_LOCK_TIMEOUT_MS??30000)||30000);
 private readonly staleLockMs=Math.max(this.lockTimeoutMs*2,Number(process.env.YAPOSAN_LOCAL_DB_STALE_LOCK_MS??300000)||300000);
 private readonly sizeWarnBytes=Math.max(1048576,Number(process.env.YAPOSAN_LOCAL_DB_WARN_BYTES??26214400)||26214400);
 constructor(private readonly persistencePath?:string){}
 private tables:{[K in EntityName]:Map<string,DatabaseSchema[K]>} = {
  users:new Map(),organizations:new Map(),memberships:new Map(),workspaces:new Map(),spaces:new Map(),spaceMemberships:new Map(),spacePosts:new Map(),spaceComments:new Map(),spaceFollows:new Map(),spaceAIAgents:new Map(),spaceConnections:new Map(),spaceComputeProfiles:new Map(),spaceStudios:new Map(),spaceStudioRuns:new Map(),spaceInvites:new Map(),spaceStoreProducts:new Map(),spaceStoreOrders:new Map(),marketplaceEntitlements:new Map(),gpuCreditTransactions:new Map(),creatorEarnings:new Map(),creatorPayouts:new Map(),projects:new Map(),assets:new Map(),versions:new Map(),subscriptions:new Map(),auditEvents:new Map(),jobs:new Map(),aiCreditTransactions:new Map(),aiCommunityTransactions:new Map(),aiProviderCredentials:new Map(),supportTickets:new Map(),supportTicketMessages:new Map(),helpFeedback:new Map(),adminPrincipals:new Map(),adminSessions:new Map(),adminAuditEvents:new Map(),adminModerationActions:new Map(),platformCostEntries:new Map(),spacePrivacySettings:new Map(),spaceDataGrants:new Map(),userSessions:new Map(),spaceSecuritySettings:new Map(),spacePostReactions:new Map(),spaceCommentReactions:new Map(),spacePostBookmarks:new Map(),spacePostReposts:new Map(),spacePostHashtags:new Map(),socialNotifications:new Map(),socialConversations:new Map(),socialConversationMembers:new Map(),socialMessages:new Map(),socialBlocks:new Map(),socialReports:new Map(),socialMediaAssets:new Map(),socialPostMedia:new Map(),socialStories:new Map(),socialStoryViews:new Map(),socialHighlights:new Map(),socialReels:new Map(),socialCommunities:new Map(),socialCommunityMembers:new Map(),socialCommunityPosts:new Map(),socialCommunityModeration:new Map(),socialPages:new Map(),socialEvents:new Map(),socialEventRsvps:new Map(),socialLiveSessions:new Map(),socialLiveChatMessages:new Map(),socialLiveReactions:new Map(),socialAiProfiles:new Map(),socialAiGenerations:new Map(),socialAiModerationSuggestions:new Map(),creatorMembershipPlans:new Map(),creatorMembershipSubscriptions:new Map(),creatorTips:new Map(),paidContentAccess:new Map(),creatorRevenueEvents:new Map(),creatorAdSettings:new Map(),creatorAdCampaigns:new Map(),creatorAdEvents:new Map(),paymentWebhookEvents:new Map(),paymentSecurityEvents:new Map(),paymentReconciliations:new Map(),moderationAppeals:new Map(),userSafetyProfiles:new Map(),authTokens:new Map()
 };
 private applyParsed(parsed:Partial<Record<EntityName,unknown[]>>){
  for(const [table,rows] of Object.entries(parsed)){
   if(!(table in this.tables)||!Array.isArray(rows))continue;
   const map=(this.tables as any)[table] as Map<string,unknown>;
   map.clear();
   for(const row of rows){if(row&&typeof row==="object"&&typeof (row as any).id==="string")map.set((row as any).id,row)}
  }
 }
 private async loadPath(path:string){
  const parsed=JSON.parse(await readFile(path,"utf8")) as Partial<Record<EntityName,unknown[]>>;
  this.applyParsed(parsed);
 }
 private backupPaths(path:string){return [`${path}.bak`,`${path}.bak.1`,`${path}.bak.2`]}
 private async reloadFromDisk(){
  if(!this.persistencePath)return;
  const path=resolve(this.persistencePath);
  try{await this.loadPath(path);return}catch(error:any){
   if(error?.code==="ENOENT")return;
   const failures:string[]=[];
   for(const backup of this.backupPaths(path)){
    try{
     await this.loadPath(backup);
     await mkdir(dirname(path),{recursive:true});
     await copyFile(backup,path);
     console.warn(`[Yaposan local database] Recovered ${path} from ${backup}.`);
     return;
    }catch(backupError:any){failures.push(`${backup}: ${backupError instanceof Error?backupError.message:String(backupError)}`)}
   }
   throw new Error(`LOCAL_DATABASE_LOAD_FAILED: ${error instanceof Error?error.message:String(error)}; backup recovery failed: ${failures.join("; ")}`);
  }
 }
 private processAlive(pid:number){
  if(!Number.isInteger(pid)||pid<=0)return false;
  try{process.kill(pid,0);return true}catch(error:any){return error?.code==="EPERM"}
 }
 private async readLockOwner(lockPath:string){
  try{return JSON.parse(await readFile(`${lockPath}/owner.json`,"utf8")) as {pid?:number;token?:string;createdAt?:string}}catch{return undefined}
 }
 private async acquireFileLock(){
  if(!this.persistencePath)return async()=>{};
  const path=resolve(this.persistencePath);
  const lockPath=`${path}.lock`;
  await mkdir(dirname(path),{recursive:true});
  const started=Date.now();
  const owner={pid:process.pid,token:randomUUID(),createdAt:new Date().toISOString()};
  while(true){
   try{
    await mkdir(lockPath);
    await writeFile(`${lockPath}/owner.json`,JSON.stringify(owner)+"\n","utf8");
    return async()=>{
     const current=await this.readLockOwner(lockPath);
     if(current?.token===owner.token&&current?.pid===owner.pid)await rm(lockPath,{recursive:true,force:true});
    };
   }catch(error:any){
    if(error?.code!=="EEXIST")throw error;
    try{
     const info=await stat(lockPath);
     const current=await this.readLockOwner(lockPath);
     const age=Date.now()-info.mtimeMs;
     if(age>this.staleLockMs&&!this.processAlive(Number(current?.pid))){
      const quarantine=`${lockPath}.stale-${current?.token??"unknown"}-${process.pid}-${Date.now()}`;
      try{await rename(lockPath,quarantine);await rm(quarantine,{recursive:true,force:true});continue}catch(renameError:any){if(renameError?.code!=="ENOENT"&&renameError?.code!=="EEXIST"&&renameError?.code!=="EPERM")throw renameError}
     }
    }catch{}
    if(Date.now()-started>this.lockTimeoutMs)throw new Error(`LOCAL_DATABASE_LOCK_TIMEOUT: ${lockPath}`);
    await new Promise(resolve=>setTimeout(resolve,50));
   }
  }
 }
 private async replaceFile(from:string,to:string){
  try{await rename(from,to)}catch(error:any){if(error?.code!=="EEXIST"&&error?.code!=="EPERM")throw error;await rm(to,{force:true});await rename(from,to)}
 }
 private async rotateBackups(path:string){
  const [bak,bak1,bak2]=this.backupPaths(path);
  try{await rm(bak2,{force:true})}catch{}
  try{await rename(bak1,bak2)}catch(error:any){if(error?.code!=="ENOENT")throw error}
  try{await rename(bak,bak1)}catch(error:any){if(error?.code!=="ENOENT")throw error}
  try{await stat(path);const bakTmp=`${bak}.tmp-${process.pid}-${Date.now()}`;await copyFile(path,bakTmp);await this.replaceFile(bakTmp,bak)}catch(error:any){if(error?.code!=="ENOENT")throw error}
 }
 private async persistUnlocked(){
  if(!this.persistencePath)return;
  const path=resolve(this.persistencePath);
  const snapshot:Record<string,unknown[]>=Object.fromEntries(Object.entries(this.tables).map(([name,map])=>[name,[...(map as Map<string,unknown>).values()]]));
  await mkdir(dirname(path),{recursive:true});
  const serialized=JSON.stringify(snapshot,null,2)+"\n";
  if(Buffer.byteLength(serialized,"utf8")>this.sizeWarnBytes)console.warn(`[Yaposan local database] ${path} is larger than ${this.sizeWarnBytes} bytes. Local JSON is intended only for small development datasets; use PostgreSQL for larger workloads.`);
  const tmp=`${path}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp,serialized,"utf8");
  await this.rotateBackups(path);
  await this.replaceFile(tmp,path);
 }
 private async withProcessGate<T>(fn:()=>Promise<T>):Promise<T>{
  let release!:()=>void;
  const gate=new Promise<void>(resolve=>{release=resolve});
  const previous=this.transactionTail;this.transactionTail=previous.then(()=>gate);
  await previous;
  try{return await fn()}finally{release()}
 }
 private async withWriteLock<T>(fn:()=>Promise<T>):Promise<T>{
  if(this.transactionDepth>0)return fn();
  return this.withProcessGate(async()=>{
   const release=await this.acquireFileLock();
   try{await this.reloadFromDisk();return await fn()}finally{await release()}
  });
 }
 private async withReadLock<T>(fn:()=>Promise<T>):Promise<T>{
  if(!this.persistencePath||this.transactionDepth>0)return fn();
  return this.withProcessGate(async()=>{
   const release=await this.acquireFileLock();
   try{await this.reloadFromDisk();return await fn()}finally{await release()}
  });
 }
 async connect(){if(this.persistencePath){const release=await this.acquireFileLock();try{await this.reloadFromDisk()}finally{await release()}}this.connected=true}
 async close(){this.connected=false}
 async migrate(){this.assertConnected();return MIGRATIONS.length}
 private assertConnected(){if(!this.connected) throw new Error("DATABASE_NOT_CONNECTED")}
 private makeRow<K extends EntityName>(value:Omit<DatabaseSchema[K],keyof RecordBase>&Partial<RecordBase>){const now=new Date().toISOString();return {...value,id:value.id??randomUUID(),createdAt:value.createdAt??now,updatedAt:now} as DatabaseSchema[K]}
 async insert<K extends EntityName>(table:K,value:Omit<DatabaseSchema[K],keyof RecordBase>&Partial<RecordBase>){
  this.assertConnected();
  if(this.transactionDepth>0){const row=this.makeRow<K>(value);(this.tables[table] as Map<string,DatabaseSchema[K]>).set(row.id,row);return structuredClone(row)}
  return this.withWriteLock(async()=>{const row=this.makeRow<K>(value);(this.tables[table] as Map<string,DatabaseSchema[K]>).set(row.id,row);await this.persistUnlocked();return structuredClone(row)});
 }
 async get<K extends EntityName>(table:K,id:string){this.assertConnected();return this.withReadLock(async()=>{const row=(this.tables[table] as Map<string,DatabaseSchema[K]>).get(id);return row?structuredClone(row):undefined})}
 async find<K extends EntityName>(table:K,predicate:(row:DatabaseSchema[K])=>boolean){this.assertConnected();return this.withReadLock(async()=>[...(this.tables[table] as Map<string,DatabaseSchema[K]>).values()].filter(predicate).map(x=>structuredClone(x)))}
 async update<K extends EntityName>(table:K,id:string,patch:Partial<DatabaseSchema[K]>){
  this.assertConnected();
  const mutate=()=>{const map=this.tables[table] as Map<string,DatabaseSchema[K]>;const current=map.get(id);if(!current)throw new Error("RECORD_NOT_FOUND");const next={...current,...patch,id,updatedAt:new Date().toISOString()} as DatabaseSchema[K];map.set(id,next);return next};
  if(this.transactionDepth>0)return structuredClone(mutate());
  return this.withWriteLock(async()=>{const next=mutate();await this.persistUnlocked();return structuredClone(next)});
 }
 async delete<K extends EntityName>(table:K,id:string){
  this.assertConnected();
  const mutate=()=> (this.tables[table] as Map<string,DatabaseSchema[K]>).delete(id);
  if(this.transactionDepth>0)return mutate();
  return this.withWriteLock(async()=>{const deleted=mutate();if(deleted)await this.persistUnlocked();return deleted});
 }
 async claimNextJob(kind:JobRecord["kind"],workerId:string,leaseSeconds:number){
  this.assertConnected();
  return this.withWriteLock(async()=>{
   const candidates=[...this.tables.jobs.values()].filter(j=>j.kind===kind&&j.status==="queued").sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
   const job=candidates[0];if(!job)return undefined;
   const next={...job,status:"running" as const,attempts:job.attempts+1,progress:1,workerId,heartbeatAt:new Date().toISOString(),leaseExpiresAt:new Date(Date.now()+leaseSeconds*1000).toISOString(),updatedAt:new Date().toISOString()};
   this.tables.jobs.set(job.id,next);await this.persistUnlocked();return structuredClone(next);
  });
 }
 async recoverStaleJobs(kind:JobRecord["kind"],now=new Date()){
  this.assertConnected();
  return this.withWriteLock(async()=>{let count=0;for(const job of this.tables.jobs.values()){if(job.kind===kind&&job.status==="running"&&job.leaseExpiresAt&&Date.parse(job.leaseExpiresAt)<=now.getTime()){this.tables.jobs.set(job.id,{...job,status:"queued",progress:0,workerId:undefined,heartbeatAt:undefined,leaseExpiresAt:undefined,error:"Recovered after worker lease expired",updatedAt:new Date().toISOString()});count++}}if(count)await this.persistUnlocked();return count});
 }
 async lock(_key:string){this.assertConnected()}
 async transaction<T>(fn:(db:DatabaseAdapter)=>Promise<T>):Promise<T>{
  this.assertConnected();
  if(this.transactionDepth>0)return fn(this);
  return this.withProcessGate(async()=>{
   const release=await this.acquireFileLock();
   try{
    await this.reloadFromDisk();
    const snapshots=structuredClone(this.tables);
    this.transactionDepth++;
    try{const result=await fn(this);this.transactionDepth--;await this.persistUnlocked();return result}catch(error){this.tables=snapshots;this.transactionDepth--;throw error}
   }finally{await release()}
  });
 }
}

export const MIGRATIONS=[
 {id:1,name:"identity-organizations-workspaces"},{id:2,name:"projects-assets-version-history"},{id:3,name:"subscriptions-audit-jobs"},{id:4,name:"ai-credit-ledger"},{id:5,name:"support-tickets"},{id:6,name:"support-lifecycle-help-feedback"},{id:7,name:"phase95-space-foundation"},{id:8,name:"phase97-ai-page-social"},{id:9,name:"phase98-ai-connections-compute"},{id:10,name:"phase100-studio-builder-runtime"},{id:11,name:"phase102-teams-permissions-creator-store"},{id:12,name:"phase103-marketplace-usage-billing"},{id:13,name:"phase104-yaposan-admin-security-production"},{id:14,name:"phase105-privacy-sharing-control-plane"},{id:15,name:"phase106-workflow-governance-observability"},{id:16,name:"phase107-identity-space-security"},{id:17,name:"phase108-ai-social-media"},{id:18,name:"phase109-complete-social-network-core"},{id:19,name:"phase110-reels-stories-media"},{id:20,name:"phase111-communities-pages-events-live"},{id:21,name:"phase112-ai-native-social"},{id:22,name:"phase113-creator-economy"}
] as const;

let singleton:DatabaseAdapter|undefined;
export async function getDatabase(){
 if(!singleton){
  if(process.env.DATABASE_URL){
   const {createPostgresDatabase}=await import("./postgresDatabase");
   singleton=await createPostgresDatabase(process.env.DATABASE_URL);
  }else{
   if(String(process.env.NODE_ENV??"development").trim().toLowerCase()==="production")throw new Error("DATABASE_URL_REQUIRED_IN_PRODUCTION");
   const inMemoryOnly=String(process.env.YAPOSAN_IN_MEMORY_ONLY??"").trim().toLowerCase()==="true";
   const localPath=inMemoryOnly?undefined:(String(process.env.YAPOSAN_LOCAL_DB_PATH??"").trim()||".yaposan/local-database.json");
   singleton=new InMemoryDatabase(localPath);await singleton.connect();await singleton.migrate();
  }
 }
 return singleton
}
export function setDatabaseAdapter(adapter:DatabaseAdapter){singleton=adapter}
