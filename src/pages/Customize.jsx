import { useParams, useNavigate } from 'react-router-dom'
import { useMenuItems } from '../hooks/useMenuItems.js'
import CustomizeModal from '../components/CustomizeModal.jsx'
import Menu from './Menu.jsx'

export default function Customize() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { items } = useMenuItems()

  const item = items.find((m) => m.id === id)

  return (
    <>
      <Menu />
      {item && (
        <CustomizeModal
          item={item}
          isOpen={true}
          onClose={() => navigate('/menu', { replace: true })}
        />
      )}
    </>
  )
}
