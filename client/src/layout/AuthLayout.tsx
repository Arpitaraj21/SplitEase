import { Box } from "@mui/material";
import { Navbar } from "../Navbar";
import { Outlet } from "react-router-dom";

export default function AuthLayout() {

    return (
        <Box sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            backgroundColor: 'linear-gradient(to right, #ddd1d1, #dbbdbd ',
            position: 'relative'
        }}>

            <Box sx={{
                display: 'flex',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 0
            }}>
                <img src="/LOGO.png" style={{
                    width: '450px',
                    height: '450px',
                    opacity: '0.5'
                }}
                />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <Navbar />

                <Outlet />
            </Box>

        </Box>
    )
}
