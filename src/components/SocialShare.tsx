import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Twitter, Facebook, Linkedin, Link, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

interface SocialShareProps {
  title: string;
  url?: string;
  description?: string;
}

const SocialShare = ({ title, url = window.location.href, description = '' }: SocialShareProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "The article link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const openShare = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Share this article</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openShare(shareLinks.twitter)}
              className="gap-2 justify-start"
            >
              <Twitter className="h-4 w-4" />
              Twitter
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => openShare(shareLinks.facebook)}
              className="gap-2 justify-start"
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => openShare(shareLinks.linkedin)}
              className="gap-2 justify-start col-span-2"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="w-full gap-2 justify-start"
          >
            {copied ? <Check className="h-4 w-4" /> : <Link className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SocialShare;