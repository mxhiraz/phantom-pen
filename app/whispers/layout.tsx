import {Header} from "./_components/Header"
export default function WhispersLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <div>
        <Header/>
        {children}
        </div>
}