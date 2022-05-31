import React, { useRef } from 'react'
import PostForm from "../components/PostForm";
import HomeTab from "../components/HomeTab";
import { Box } from "@mui/material"

export default function Home() {
  const tabRef = useRef(null)
  const onSubmitSuccess = () => {
    tabRef.current.reload()
  }
  return (
    <Box>
      <PostForm onSubmitSuccess={onSubmitSuccess} />
      <HomeTab ref={tabRef} />
    </Box>
  )
}
