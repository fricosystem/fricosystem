import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, FileText, Download, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const OWNERS_PASSWORD = "Restrecovery";

const Owners = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already authenticated in this session
    const authenticated = sessionStorage.getItem("owners_authenticated");
    if (authenticated === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === OWNERS_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("owners_authenticated", "true");
      toast({
        title: "Access Granted",
        description: "Welcome to the Owners Portal",
      });
      setPassword("");
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password. Please try again.",
        variant: "destructive",
      });
      setPassword("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("owners_authenticated");
    toast({
      title: "Logged Out",
      description: "You've been logged out of the Owners Portal",
    });
  };

  // Login form view
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black px-4 py-20">
          <Card className="w-full max-w-md bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl text-white">Owners Only Access</CardTitle>
              <CardDescription className="text-white/70">
                Please enter the password to access the owners portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
                    className="flex-1"
                  >
                    Back to Home
                  </Button>
                  <Button type="submit" className="flex-1">
                    Submit
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Owners portal view (authenticated)
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gradient-to-br from-black via-gray-900 to-black px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Authenticated</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Owners Portal
            </h1>
            <p className="text-xl text-white/70 mb-6">
              Access exclusive resources and documentation
            </p>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>

          {/* Resources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* JotForm Card */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5 text-primary" />
                  Owner Portal Form
                </CardTitle>
                <CardDescription className="text-white/70">
                  Access the main owners portal form
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => window.open("https://form.jotform.com/252743400922047", "_blank")}
                >
                  Open Portal Form
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Standard Operating Procedures */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">Standard Operating Procedures</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Equipment Maintenance SOP */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Equipment Maintenance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open("/documents/Equipment_Maintenance_SOP.pdf", "_blank")}
                  >
                    View PDF
                  </Button>
                  <a 
                    href="/documents/Equipment_Maintenance_SOP.pdf" 
                    download
                    className="block"
                  >
                    <Button variant="secondary" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </a>
                </CardContent>
              </Card>

              {/* Daily Operations SOP */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Daily Operations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open("/documents/Daily_Operations_SOP.pdf", "_blank")}
                  >
                    View PDF
                  </Button>
                  <a 
                    href="/documents/Daily_Operations_SOP.pdf" 
                    download
                    className="block"
                  >
                    <Button variant="secondary" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </a>
                </CardContent>
              </Card>

              {/* Front Desk Guide SOP */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Front Desk Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open("/documents/Front_Desk_Guide_Sop.pdf", "_blank")}
                  >
                    View PDF
                  </Button>
                  <a 
                    href="/documents/Front_Desk_Guide_Sop.pdf" 
                    download
                    className="block"
                  >
                    <Button variant="secondary" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </a>
                </CardContent>
              </Card>

              {/* Client Experience SOP */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Client Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open("/documents/Client_Experience_SOP.pdf", "_blank")}
                  >
                    View PDF
                  </Button>
                  <a 
                    href="/documents/Client_Experience_SOP.pdf" 
                    download
                    className="block"
                  >
                    <Button variant="secondary" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </a>
                </CardContent>
              </Card>

              {/* Membership and Sales SOP */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Membership & Sales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open("/documents/Membership_and_Sales_SOP.pdf", "_blank")}
                  >
                    View PDF
                  </Button>
                  <a 
                    href="/documents/Membership_and_Sales_SOP.pdf" 
                    download
                    className="block"
                  >
                    <Button variant="secondary" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </a>
                </CardContent>
              </Card>

              {/* Electrical Specs */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Equipment/Electrical Specs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open("/documents/Electrical_specs_Updated.pdf", "_blank")}
                  >
                    View PDF
                  </Button>
                  <a 
                    href="/documents/Electrical_specs_Updated.pdf" 
                    download
                    className="block"
                  >
                    <Button variant="secondary" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Owners;
