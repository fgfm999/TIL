import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { Box, Tab } from "@mui/material"
import { TabContext, TabList, TabPanel } from "@mui/lab"
import Timeline from "./Timeline"

function HomeTab(_props, ref) {
    const [value, setValue] = useState("1")
    const [isInit, setInit] = useState(false)
    const [publicTimeline, setPublicTime] = useState([])
    const [userTimeline, setUserTimeline] = useState([])

    const reloadPublicTimeline = () => {
        window.contract.public_timeline({ page: "1", page_size: "100" })
            .then(posts => {
                setPublicTime(posts)
            })
    }
    const reloadUserTimeline = () => {
        if (window.walletConnection.isSignedIn()) {
            window.contract.user_timeline({ page: "1", page_size: "100", user: window.accountId })
                .then(posts => {
                    setUserTimeline(posts)
                })
        }
    }
    const reload = (activeTab) => {
        switch (activeTab) {
            case "1": // reload public timeline
                reloadPublicTimeline()
                break
            case "2": // reload user timeline
                reloadUserTimeline()
                break
        }
    }

    const handleChange = (_event, newValue) => {
        reload(newValue)
        setValue(newValue)
    }

    useEffect(() => {
        if (!isInit) {
            reloadPublicTimeline()
            setInit(true)
        }
    }, [])

    useImperativeHandle(ref, () => ({
        reload: () => {
            reload(value)
        }
    }))


    // const posts = [{ content: "hello", id: 1 }, { content: "bye", id: 2 }]
    return (
        <Box>
            <TabContext value={value} onChange>
                <Box>
                    <TabList onChange={handleChange} centered>
                        <Tab label="World" value="1" />
                        <Tab label="Me" value="2" />
                    </TabList>
                </Box>
                <TabPanel value="1">
                    <Timeline posts={publicTimeline} />
                </TabPanel>
                <TabPanel value="2">
                    <Timeline posts={userTimeline} />
                </TabPanel>
            </TabContext>
        </Box>
    )
}
export default forwardRef(HomeTab)