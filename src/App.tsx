import { Routes, Route } from 'react-router'
import { VSCodeProvider } from '@/context/VSCodeContext'
import VSCodeShell from '@/components/VSCodeShell'

export default function App() {
  return (
    <VSCodeProvider>
      <Routes>
        <Route path="/" element={<VSCodeShell />} />
      </Routes>
    </VSCodeProvider>
  )
}
