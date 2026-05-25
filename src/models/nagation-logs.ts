export class NavigationLogs {
    id: bigint | null;
    parentId: bigint | null;
    title: string;
    slug: string;
    prompt: string | null;
    answerSummary: string | null;
    responseType: 'TEXT' | 'LINK';
    linkLabel: string | null;
    linkUrl: string | null;
    evidenceExcerpt: string | null;
    evidenceSource: string | null;
    displayOrder: number;
    isActive: boolean;

    constructor(
        id: bigint | null,
        parentId: bigint | null,
        title: string,
        slug: string,
        prompt: string | null = null,
        answerSummary: string | null = null,
        responseType: 'TEXT' | 'LINK' = 'TEXT',
        linkLabel: string | null = null,
        linkUrl: string | null = null,
        evidenceExcerpt: string | null = null,
        evidenceSource: string | null = null,
        displayOrder: number = 0,
        isActive: boolean = true
    ) {
        this.id = id;
        this.parentId = parentId;
        this.title = title;
        this.slug = slug;
        this.prompt = prompt;
        this.answerSummary = answerSummary;
        this.responseType = responseType;
        this.linkLabel = linkLabel;
        this.linkUrl = linkUrl;
        this.evidenceExcerpt = evidenceExcerpt;
        this.evidenceSource = evidenceSource;
        this.displayOrder = displayOrder;
        this.isActive = isActive;
    }
}