import { ResetPasswordContent } from "./reset-password-content";

export const dynamic = "force-dynamic";

type PageProps = {
    searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const token = params.token || "";

    return <ResetPasswordContent tokenFromUrl={token} />;
}
