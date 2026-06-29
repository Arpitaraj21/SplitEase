import { Grid, Box, Button } from "@mui/material"
import { useNavigate } from "react-router-dom"
import Signup from "./components/Signup";
export function Navbar() {

    const navigate = useNavigate();
    return (
        <Grid container spacing={2}>
            <Grid size={12} >
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    width: '100vw',
                }}>
                    <Button
                        sx={{
                            backgroundColor: '#4699e7',
                            color: 'white',
                            margin: '10px 20px'
                        }}
                        onClick={() => navigate("/login")}
                        >
                        Login
                    </Button>
                    <Button
                        sx={{
                            backgroundColor: '#4699e7',
                            color: 'white',
                            margin: '10px 20px'
                        }}
                        onClick={() => navigate("/signup")}
                    >
                        Signup
                    </Button>
                </Box>
            </Grid>
        </Grid>
    )
}